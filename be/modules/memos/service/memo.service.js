import {NotFoundError, InternalServerError, BadRequestError} from "../../../utils/customError.js";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import {COMMON_MESSAGES} from "../../../constants/message.js";
import {getCategoryAndCheckPermission} from "../../../utils/permissionCheck.js";
import axios from "axios";

class MemoService {
  constructor(memoRepository, tagService, elasticClient, permissionCheckHelper, geminiService) {
    this.memoRepository = memoRepository;
    this.tagService = tagService;
    this.elasticClient = elasticClient;
    this.permissionCheckHelper = permissionCheckHelper;
    this.geminiService = geminiService;
  }

  // 권한 확인 헬퍼 메서드
  async _getMemoAndCheckPermission(memoIdsOrId, createdBy, withContent = false) {
    let queryCondition;
    let memos;
    const projection = withContent ? {} : {content: 0};

    if (Array.isArray(memoIdsOrId)) {
      if (memoIdsOrId.length === 0) {
        return [];
      }
      queryCondition = {_id: {$in: memoIdsOrId}, createdBy};
      memos = await this.memoRepository.find(queryCondition, projection);
      if (memos.length !== memoIdsOrId.length) {
        throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
      }
    } else {
      queryCondition = {_id: memoIdsOrId, createdBy};
      memos = await this.memoRepository.findOne(queryCondition, projection);
      if (!memos) {
        throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
      }
    }
    return memos;
  }

  // 태그 처리 헬퍼 함수
  async _processTags(tagNames) {
    if (!tagNames || tagNames.length === 0) return [];

    const tagIds = [];
    for (const tagName of tagNames) {
      const tag = await this.tagService.findOrCreateTag(tagName);
      tagIds.push(tag._id);
    }
    return tagIds;
  }

  // 마크다운을 일반 텍스트로 변환하는 헬퍼 함수 -> 다른 곳에서 처리를 하는지 확인
  // 우선 놔두기
  async _convertMarkdownToText(markdownContent) {
    if (!markdownContent) {
      return "";
    }
    const result = await unified().use(remarkParse).use(stripMarkdown).process(markdownContent);
    return String(result);
  }

  // 엘라스틱서치에 벡터 저장 헬퍼 함수
  async _saveVectorToElasticsearch(memoId, memoVectors, createdBy) {
    const indexName = "memos";
    if (!memoVectors || memoVectors.length === 0) return;

    // 기존 문서 삭제
    try {
      await this.elasticClient.deleteByQuery({
        index: indexName,
        query: {term: {memoId}},
      });
    } catch (err) {
      if (!(err.meta && err.meta.statusCode === 404)) throw err;
    }

    const body = [];
    memoVectors.forEach((vector, i) => {
      body.push({index: {_index: indexName, _id: `${memoId}_${i}`}});
      body.push({
        memoId,
        createdBy,
        sentenceIndex: i,
        vector,
        createdAt: new Date(),
      });
    });

    const bulkResponse = await this.elasticClient.bulk({refresh: true, body});

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const op = Object.keys(action)[0];
        if (action[op].error) {
          erroredDocuments.push({
            status: action[op].status,
            error: action[op].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      if (erroredDocuments.length > 0) console.error("Bulk insert errors:", erroredDocuments);
    }

    console.log(`Memo ${memoId} vectors saved to Elasticsearch (${memoVectors.length} sentences) via bulk.`);
  }

  async _processVectorization(memo) {
    try {
      const tagsForVectorization = memo.tags.map((tag) => tag.tagName);

      const dataToSend = {
        title: memo.title,
        content: memo.content,
        tags: tagsForVectorization,
      };

      const response = await axios.post("http://localhost:8000/vectorize", dataToSend);

      const vectorResult = response.data;
      await this._saveVectorToElasticsearch(memo._id, vectorResult.vectors, memo.createdBy);
      console.log(`Vectorization and save complete for memo ID: ${memo._id}, sentences: ${vectorResult.sentenceCount}`);
    } catch (error) {
      console.error(`[VECTORIZATION ERROR] Failed to vectorize memo ID ${memo._id}:`, error.message);
    }
  }

  // 엘라스틱서치 벡터 삭제 헬퍼 함수
  async _deleteVectorsFromElasticsearch(memoIds) {
    if (!memoIds || memoIds.length === 0) {
      return;
    }
    const indexName = "memos";
    try {
      const response = await this.elasticClient.deleteByQuery({
        index: indexName,
        query: {
          terms: {
            memoId: memoIds,
          },
        },
      });
      console.log(
        `Elasticsearch vectors for memo IDs ${memoIds.join(", ")} deleted. Result: ${response.deleted} documents.`
      );
    } catch (error) {
      console.error(`[ELASTICSEARCH DELETE ERROR] Failed to delete vectors for memo IDs ${memoIds.join(", ")}:`, error);
      throw new InternalServerError(COMMON_MESSAGES.DELETION_FAILED);
    }
  }

  // 생성
  async createMemo(data) {
    const {title, content, categoryId, createdBy, tags} = data;

    await getCategoryAndCheckPermission(categoryId, createdBy);
    const tagIds = await this._processTags(tags);

    const dataToCreate = {title, content, categoryId, createdBy, tags: tagIds};
    try {
      const newMemo = await this.memoRepository.create(dataToCreate);
      const createdMemo = await this.memoRepository.findOne(newMemo._id);
      await this.tagService.incrementTagUsage(tagIds);
      this._processVectorization(createdMemo);
      return createdMemo;
    } catch (error) {
      console.error("Error creating memo:", error);
      throw new InternalServerError(COMMON_MESSAGES.CREATION_FAILED);
    }
  }

  // 카테고리 내 메모 목록 조회
  async getMemoList(data) {
    const allowedSortKeys = ["title", "createdAt", "updatedAt"];
    const allowedSortOrders = ["asc", "desc"];

      const {
        categoryId,
        createdBy,
        sortKey: requestedSortKey = "updatedAt",
        sortOrder: requestedSortOrder = "desc",
      } = data;
    await getCategoryAndCheckPermission(categoryId, createdBy);

    const sortKey = allowedSortKeys.includes(requestedSortKey) ? requestedSortKey : "updatedAt";
    const sortOrder = allowedSortOrders.includes(requestedSortOrder) ? requestedSortOrder : "desc";
    const filter = {categoryId, createdBy};
    const projection = {content: 0};
    const options = {
      sort: {[sortKey]: sortOrder},
    };

    const memos = await this.memoRepository.find(filter, projection, options);
    return memos;
  }

  // 상세 조회
  async getMemoDetail(data) {
    const {memoId, createdBy} = data;
    const memo = await this._getMemoAndCheckPermission(memoId, createdBy, true);
    
    // 이미지가 있으면 Pre-signed URL 생성
    if (memo.images && memo.images.length > 0) {
      const imagesWithUrls = await Promise.all(
        memo.images.map(async (image) => {
          if (image.s3Key) {
            const presignedUrl = await this.fileService.getPresignedUrlForDownload({ 
              key: image.s3Key 
            });
            return {
              ...image,
              url: presignedUrl  // 동적으로 생성된 URL 추가
            };
          }
          return image;
        })
      );
      
      return {
        ...memo,
        images: imagesWithUrls
      };
    }
    
    return memo;
  }

  // 메모 검색
  async searchMemos(data) {
    const {q, isFuzzy, createdBy} = data;

    if (!q) {
      return [];
    }

    let memos;
    const findCondition = {
      createdBy: createdBy,
      $or: [{title: {$regex: q, $options: "i"}}, {content: {$regex: q, $options: "i"}}],
    };

    const tag = await this.tagService.findTagByName(q);
    if (tag) {
      findCondition.$or.push({tags: tag._id});
    }

    const projection = {content: 0};
    memos = await this.memoRepository.find(findCondition, projection);
    console.log("mongodb 검색");
    console.log(memos.length);
    console.log(memos);
    if (isFuzzy === "true") {
      const memoIds = memos.map((memo) => memo._id.toString());
      let queryVector;
      try {
        const response = await axios.post("http://localhost:8000/query-vector", {
          query: q,
        });
        queryVector = response.data.vector;
      } catch (error) {
        throw new Error(`Vectorization failed: ${error.message}`);
      }

      const memoCount = await this.memoRepository.count({createdBy});
      const kValue = 20;
      const numCandidates = Math.max(100, kValue);
      const searchResults = await this.elasticClient.search({
        index: "memos",
        fields: ["_id", "memoId", "_score"],
        knn: {
          field: "vector",
          query_vector: queryVector,
          k: kValue,
          num_candidates: numCandidates,
          filter: {
            term: {createdBy: createdBy},
          },
        },
        size: 1000,
      });
      const memoScores = {};
      searchResults.hits.hits.forEach((hit) => {
        if (memoIds.includes(hit.fields.memoId[0])) return;
        const memoId = hit.fields.memoId[0];
        const score = hit._score;
        if (!memoScores[memoId] || score > memoScores[memoId]) {
          memoScores[memoId] = score;
        }
      });
      console.log(memoScores);

      const sortedMemoIds = Object.keys(memoScores)
        .filter((memoId) => memoScores[memoId] > 0.75)
        .sort((a, b) => memoScores[b] - memoScores[a]);
      const fuzzyMemos = await this._getMemoAndCheckPermission(sortedMemoIds, createdBy);
      console.log("fuzzy 검색");
      console.log(fuzzyMemos);
      memos = memos.concat(fuzzyMemos);
      console.log("전체 검색");
      console.log(memos);
    }
    return memos;
  }

  // 메모 수정
  async updateMemo(data) {
    const {memoId, title, content, createdBy, tags} = data;
    const existingMemo = await this._getMemoAndCheckPermission(memoId, createdBy, true);

    if (existingMemo.tags && existingMemo.tags.length > 0) {
      const existingTagIds = existingMemo.tags.map((tag) => tag._id.toString());
      await this.tagService.decrementTagUsage(existingTagIds);
    }

    const newTagIds = await this._processTags(tags);
    await this.tagService.incrementTagUsage(newTagIds);

    const filter = {_id: memoId, createdBy};
    const update = {title, content, tags: newTagIds};
    const updatedMemo = await this.memoRepository.updateOne(filter, update);
    if (!updatedMemo) {
      throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
    }
    this._processVectorization(updatedMemo);

    return updatedMemo;
  }

  // 메모 즐겨찾기 추가/삭제
  async updateMemosFav(data) {
    const {memoIds, createdBy, isFavorite} = data;
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    const filter = {
      _id: {$in: memoIds},
      createdBy: createdBy,
    };
    const update = {
      $set: {
        isFavorite: isFavorite,
      },
    };
    const updatedMemos = await this.memoRepository.updateMany(filter, update);
    return updatedMemos;
  }

  // 메모 이동 (최소 1개)
  async moveMemos(data) {
    const {memoIds, categoryId, createdBy} = data;
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    const filter = {
      _id: {$in: memoIds},
      createdBy: createdBy,
    };
    const update = {
      $set: {
        categoryId: categoryId,
      },
    };
    const updatedMemos = await this.memoRepository.updateMany(filter, update);
    return updatedMemos;
  }

  // 메모 이동 (카테고리별)
  async moveMemosByCategoryIds(data) {
    const {categoryIds, newCategoryId, createdBy} = data;
    const filter = {
      categoryId: {$in: categoryIds},
      createdBy: createdBy,
    };
    const update = {
      $set: {
        categoryId: newCategoryId,
      },
    };
    const updatedMemos = await this.memoRepository.updateMany(filter, update);
    return updatedMemos;
  }

  // 메모 복사
  async copyMemo(data) {
    const {memoId, createdBy} = data;
    const memo = await this._getMemoAndCheckPermission(memoId, createdBy, true);
    const title = memo.title + " copy";
    const {content, categoryId, tags} = memo;
    const query = {title, content, categoryId, createdBy, tags};

    // S3에서 이미지 복사하는 로직 추가 필요

    const copiedMemo = await this.memoRepository.create(query);

    if (tags && tags.length > 0) {
      await this.tagService.incrementTagUsage(tags);
    }
    return copiedMemo;
  }

  // 메모 삭제 (최소 1개)
  // TODO: S3 이미지 삭제 로직 추가 필요
  async deleteMemos(data) {
    const {memoIds, createdBy} = data;
    const memosToDelete = await this._getMemoAndCheckPermission(memoIds, createdBy, true);
    if (memosToDelete.length === 0) {
      return {deletedCount: 0};
    }

    const memoIdsStrings = memosToDelete.map((memo) => memo._id.toString());
    const tagIdsToDecrement = memosToDelete.flatMap((memo) =>
      memo.tags ? memo.tags.map((tag) => tag._id.toString()) : []
    );

    const filter = {_id: {$in: memoIdsStrings}, createdBy};
    const result = await this.memoRepository.deleteMany(filter);

    if (tagIdsToDecrement.length > 0) {
      await this.tagService.decrementTagUsage(tagIdsToDecrement);
    }
    await this._deleteVectorsFromElasticsearch(memoIdsStrings);
    return result;
  }

  async deleteMemosByCategoryIds(categoryIds) {
    const filter = {categoryId: {$in: categoryIds}};
    const memos = await this.memoRepository.find(filter);
    if (memos.length === 0) return;

    const memoIdsToDelete = memos.map((memo) => memo._id.toString());
    const tagIdsToDecrement = memos.flatMap((memo) => (memo.tags ? memo.tags.map((tag) => tag._id.toString()) : []));

    const result = await this.memoRepository.deleteMany(filter);
    if (tagIdsToDecrement.length > 0) {
      await this.tagService.decrementTagUsage(tagIdsToDecrement);
    }
    await this._deleteVectorsFromElasticsearch(memoIdsToDelete);
    return result;
  }

  // 해시태그 자동 생성 => 메모 생성 시 모달을 띄워 물어본 후 생성
  async makeHashtags(memoId) {
    const query = {_id: memoId};
    let memo = await this.memoRepository.findOne(query); // content만 필요

    // TODO: 중간 처리 과정 필요

    // 없는 경우 에러 처리

    // markdown -> text 변환 로직 추가 필요
    const plainText = await this._convertMarkdownToText(memo.content);

    // 제미나이 요청 api 로직 -> 프론트에서는 로딩 화면 띄우기
    // 나온 결과 유효성 검사 -> 해당 로직에서 직접 진행
    const tags = [];

    // 클라이언트로 반환 -> 이후 사용자가 수락하면 메모 수정으로 태그 추가
    return memo;
  }

  /* 텍스트 요약 - Gemini AI */
  async summarizeText(data) {
    try {
      // content만 전달
      const content = typeof data === "string" ? data : data.content;
      if (!content || typeof content !== "string") {
        throw new BadRequestError("요약할 텍스트 내용이 제공되지 않았습니다.");
      }
      const result = await this.geminiService.summarizeText(content);
      return {
        success: true,
        summary: result.summary,
        originalLength: result.originalLength,
        summaryLength: result.summaryLength,
        type: "text",
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error("Text summarization error:", error);

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError("텍스트 요약 처리 중 오류가 발생했습니다.");
    }
  }

  /* 이미지 요약 - Gemini Vision AI */
  async summarizeImage(data) {
    try {
      const {imageData} = data;
      if (!imageData) {
        throw new BadRequestError("요약할 이미지 데이터가 제공되지 않았습니다.");
      }
      // 이미지 데이터 형식 검증
      if (!imageData.data || !imageData.mimeType) {
        throw new BadRequestError("이미지 데이터 형식이 올바르지 않습니다. data와 mimeType이 필요합니다.");
      }
      // 지원하는 이미지 형식 검증
      const supportedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"];
      if (!supportedMimeTypes.includes(imageData.mimeType.toLowerCase())) {
        throw new BadRequestError("지원하지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP, BMP만 지원됩니다.");
      }
      const result = await this.geminiService.summarizeImage(imageData);
      return {
        success: true,
        summary: result.summary,
        imageType: result.imageType,
        summaryLength: result.summaryLength,
        type: "image",
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error("Image summarization error:", error);

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError("이미지 요약 처리 중 오류가 발생했습니다.");
    }
  }

  /* S3 업로드와 함께 이미지 요약 */
  async summarizeImageWithS3(data) {
    try {
      const {imageData, s3Url, s3Key, memoId, createdBy} = data;

      // 1. 이미지 요약 생성
      const summaryResult = await this.geminiService.summarizeImage(imageData);

      // 2. 메모가 있다면 이미지 정보 저장
      if (memoId) {
        const memo = await this._getMemoAndCheckPermission(memoId, createdBy);

        // 메모에 이미지 정보 추가 (s3Key 포함)
        const updatedMemo = await this.memoRepository.updateOne(
          {_id: memoId},
          {
            $push: {
              images: {
                url: s3Url,
                s3Key: s3Key,  // S3 키 저장
                summary: summaryResult.summary,
                uploadedAt: new Date(),
                metadata: {
                  size: imageData.data.length,  // base64 크기
                  mimeType: imageData.mimeType,
                  originalName: data.originalName
                }
              }
            }
          }
        );
      }

      return {
        success: true,
        summary: summaryResult.summary,
        imageUrl: s3Url,
        s3Key: s3Key,
        imageType: summaryResult.imageType,
        summaryLength: summaryResult.summaryLength,
        type: "image",
        timestamp: summaryResult.timestamp
      };
    } catch (error) {
      console.error("Image summarization with S3 error:", error);
      throw error;
    }
  }

  /* 다중 이미지 요약 (이미지 그룹용) */
  async summarizeMultipleImages(data) {
    try {
      const {imageDataArray} = data;
      if (!Array.isArray(imageDataArray) || imageDataArray.length === 0) {
        throw new BadRequestError("요약할 이미지 배열이 제공되지 않았습니다.");
      }
      if (imageDataArray.length > 5) {
        throw new BadRequestError("한번에 최대 5개의 이미지만 처리할 수 있습니다.");
      }
      // 각 이미지 데이터 검증
      for (let i = 0; i < imageDataArray.length; i++) {
        const imageData = imageDataArray[i];
        if (!imageData.data || !imageData.mimeType) {
          throw new BadRequestError(`이미지 ${i + 1}의 데이터 형식이 올바르지 않습니다.`);
        }
      }
      const result = await this.geminiService.summarizeMultipleImages(imageDataArray);
      return {
        success: true,
        summary: result.summary,
        imageCount: result.imageCount,
        summaryLength: result.summaryLength,
        type: "multiple_images",
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error("Multiple images summarization error:", error);

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError("다중 이미지 요약 처리 중 오류가 발생했습니다.");
    }
  }

  /* 메모 내용 요약 (텍스트 및 이미지 통합 요약) */
  async summarizeMemoText(data) {
    try {
      const {memoId, createdBy} = data;

      // 메모 조회 및 권한 확인
      const memo = await this._getMemoAndCheckPermission(memoId, createdBy);

      if (!memo.content && (!memo.images || memo.images.length === 0)) {
        throw new BadRequestError("요약할 메모 내용이 없습니다.");
      }

      let textSummary = null;
      let imageSummaries = [];

      // 텍스트 요약
      if (memo.content && memo.content.trim().length > 0) {
        textSummary = await this.summarizeText(memo.content);
      }

      // 이미지 요약
      if (memo.images && memo.images.length > 0) {
        if (memo.images.length === 1) {
          const imageSummary = await this.summarizeImage({
            imageData: memo.images[0],
          });
          imageSummaries.push(imageSummary);
        } else {
          const multiImageSummary = await this.summarizeMultipleImages({
            imageDataArray: memo.images,
          });
          imageSummaries.push(multiImageSummary);
        }
      }

      // 통합 요약 생성
      const combinedSummary = {
        success: true,
        type: "memo",
        timestamp: new Date().toISOString(),
        memoInfo: {
          id: memo._id,
          title: memo.title,
          hasContent: !!textSummary,
          imageCount: memo.images ? memo.images.length : 0,
        },
      };

      if (textSummary) {
        combinedSummary.textSummary = {
          summary: textSummary.summary,
          originalLength: textSummary.originalLength,
          summaryLength: textSummary.summaryLength,
        };
      }

      if (imageSummaries.length > 0) {
        combinedSummary.imageSummary = imageSummaries[0].summary;
      }

      return combinedSummary;
    } catch (error) {
      console.error("Memo text summarization error:", error);

      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }

      throw new InternalServerError("메모 텍스트 요약 중 오류가 발생했습니다.");
    }
  }

  // 추천
  async recommendMemos(data) {
    const {memoId, createdBy} = data;
    if (!memoId) {
      return [];
    }

    // 1. 기준 메모의 모든 문장 벡터 조회
    const referenceVectors = await this.elasticClient.search({
      index: "memos",
      query: {
        bool: {
          filter: [{term: {createdBy: createdBy}}, {term: {memoId: memoId}}],
        },
      },
      _source: ["vector"],
    });

    const hits = referenceVectors.hits.hits;
    if (hits.length === 0) {
      console.warn(`No vectors found for memoId: ${memoId}`);
      return [];
    }

    // 2. 문장 벡터들의 평균을 계산하여 단일 쿼리 벡터 생성
    const sumVector = new Array(hits[0]._source.vector.length).fill(0);
    hits.forEach((hit) => {
      const vector = hit._source.vector;
      for (let i = 0; i < vector.length; i++) {
        sumVector[i] += vector[i];
      }
    });
    const avgVector = sumVector.map((value) => value / hits.length);

    // 3. 평균 벡터를 사용하여 유사한 메모 검색
    const memoCount = await this.memoRepository.count({createdBy});
    const kValue = 20;
    const numCandidates = Math.max(memoCount, kValue);
    const searchResults = await this.elasticClient.search({
      index: "memos",
      fields: ["_id", "memoId", "_score"],
      knn: {
        field: "vector",
        query_vector: avgVector,
        k: kValue,
        num_candidates: numCandidates,
        filter: {
          bool: {
            must: {term: {createdBy: createdBy}},
            must_not: {term: {memoId: memoId}},
          },
        },
      },
      size: 1000,
    });

    // 5. 검색 결과 정제 및 정렬
    const memoScores = {};
    searchResults.hits.hits.forEach((hit) => {
      const recommendedMemoId = hit.fields.memoId[0];
      const score = hit._score;
      if (!memoScores[recommendedMemoId] || score > memoScores[recommendedMemoId]) {
        memoScores[recommendedMemoId] = score;
      }
    });

    const sortedMemoIds = Object.keys(memoScores)
      .filter((id) => memoScores[id] > 0.65)
      .sort((a, b) => memoScores[b] - memoScores[a])
      .slice(0, 3);

    console.log("Recommended Memo IDs:", memoScores);

    // 6. MongoDB에서 최종 메모 조회 및 반환
    const recommendedMemos = await this._getMemoAndCheckPermission(sortedMemoIds, createdBy, true);
    const sortedRecommendedMemos = sortedMemoIds
      .map((id) => recommendedMemos.find((memo) => memo._id.toString() === id))
      .filter((memo) => memo);

    return sortedRecommendedMemos;
  }
}

export default MemoService;
