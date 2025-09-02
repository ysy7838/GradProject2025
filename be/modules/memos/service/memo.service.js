import {NotFoundError, InternalServerError} from "../../../utils/customError.js";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import {COMMON_MESSAGES} from "../../../constants/message.js";
import {getCategoryAndCheckPermission} from "../../../utils/permissionCheck.js";
import {spawn} from "child_process";
import path from "path";
import {fileURLToPath} from "url";
import axios from "axios";

class memoService {
  constructor(memoRepository, tagService, elasticClient, permissionCheckHelper) {
    this.memoRepository = memoRepository;
    this.tagService = tagService;
    this.elasticClient = elasticClient;
    this.permissionCheckHelper = permissionCheckHelper;
  }

  // 메모 권한 체크 헬퍼 함수
  async _getMemoAndCheckPermission(memoIdsOrId, createdBy) {
    let queryCondition;
    let memos;

    if (Array.isArray(memoIdsOrId)) {
      queryCondition = {_id: {$in: memoIdsOrId}, createdBy};
      memos = await this.memoRepository.find(queryCondition);
      if (memos.length !== memoIdsOrId.length) {
        throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
      }
    } else {
      queryCondition = {_id: memoIdsOrId, createdBy};
      memos = await this.memoRepository.findOne(queryCondition);
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

  _runPythonVectorize(memoContent) {
    return new Promise((resolve, reject) => {
      // 파이썬 스크립트와 인자를 전달하여 실행
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const pythonScriptPath = path.join(__dirname, "../../../utils/vectorize.py");
      const pythonProcess = spawn("python", [pythonScriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      const contentData = {content: memoContent.normalize("NFC")};
      const jsonString = JSON.stringify(contentData);
      pythonProcess.stdin.write(jsonString, "utf8");
      pythonProcess.stdin.end();
      let output = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`Python script exited with code ${code}, error: ${error}`));
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${e.message}, stderr: ${error}`));
        }
      });
    });
  }

  async _saveVectorToElasticsearch(memoId, memoVectors) {
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

  // 생성
  async createMemo(data) {
    const {title, content, categoryId, createdBy, tags} = data;

    await getCategoryAndCheckPermission(categoryId, createdBy);
    const tagIds = await this._processTags(tags);

    const dataToCreate = {title, content, categoryId, createdBy, tags: tagIds};
    try {
      const newMemo = await this.memoRepository.create(dataToCreate);
      // TODO: 벡터화 및 엘라스틱서치 저장 로직 추가
      await this.tagService.incrementTagUsage(tagIds);
      return newMemo;
    } catch (error) {
      throw new InternalServerError(COMMON_MESSAGES.CREATION_FAILED);
    }
  }

  // 카테고리 내 메모 목록 조회
  async getMemoList(data) {
    const {categoryId, createdBy} = data;
    await getCategoryAndCheckPermission(categoryId, createdBy);

    const filter = {categoryId, createdBy};
    const projection = {content: 0}; // content 필드 제외
    const memos = await this.memoRepository.find(filter, projection);
    return memos;
  }

  // 상세 조회
  async getMemoDetail(data) {
    const {memoId, createdBy} = data;
    return this._getMemoAndCheckPermission(memoId, createdBy);
  }

  // 메모 수정
  async updateMemo(data) {
    const {memoId, title, content, createdBy, tags} = data;
    const existingMemo = await this._getMemoAndCheckPermission(memoId, createdBy);

    if (existingMemo.tags && existingMemo.tags.length > 0) {
      const existingTagIds = existingMemo.tags.map((tag) => tag._id.toString());
      await this.tagService.decrementTagUsage(existingTagIds);
    }

    const newTagIds = await this._processTags(tags);

    const filter = {
      _id: memoId,
      createdBy: createdBy,
    };
    const update = {
      $set: {
        title: title,
        content: content,
        tags: newTagIds,
      },
    };
    const updatedMemo = await this.memoRepository.updateOne(filter, update);
    // TODO: 벡터화 및 엘라스틱서치 저장 로직 추가
    await this.tagService.incrementTagUsage(newTagIds);

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
    const memo = await this._getMemoAndCheckPermission(memoId, createdBy);
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
  async deleteMemos(data) {
    const {memoIds, createdBy} = data;
    const memos = await this._getMemoAndCheckPermission(memoIds, createdBy);

    const tagIdsToDecrement = memoArray.flatMap((memo) =>
      memo.tags ? memo.tags.map((tag) => tag._id.toString()) : []
    );

    const filter = {_id: {$in: memoIds}, createdBy};
    const result = await this.memoRepository.deleteMany(filter);

    if (tagIdsToDecrement.length > 0) {
      await this.tagService.decrementTagUsage(tagIdsToDecrement);
    }

    return result;
  }

  async deleteMemosByCategoryIds(categoryIds) {
    const filter = {categoryId: {$in: categoryIds}};
    const memos = await this.memoRepository.find(filter);
    if (memos.length === 0) return;

    const tagIdsToDecrement = memos.flatMap((memo) => (memo.tags ? memo.tags.map((tag) => tag._id.toString()) : []));

    const result = await this.memoRepository.deleteMany(filter);
    if (tagIdsToDecrement.length > 0) {
      await this.tagService.decrementTagUsage(tagIdsToDecrement);
    }
    return result;
  }

  // 해시태그 자동 생성 => 추가 필요
  async makeHashtags(memoId) {
    const query = {_id: memoId};
    const memo = await this.memoRepository.findOne(query);
    // TODO: 중간 처리 과정 필요
    // 조회 -> 처리
    return memo;
  }

  // 메모 벡터 변환 => 메모 생성 / 수정에 합칠 예정
  async convertToVec(memoId) {
    const query = {_id: memoId};
    const memo = await this.memoRepository.findOne(query);
    if (!memo) {
      throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
    }
    console.log(`Converting memo ${memoId} to vector via FastAPI...`);

    try {
      // FastAPI 서버의 벡터화 엔드포인트에 요청
      const response = await axios.post("http://localhost:8000/vectorize", {
        content: memo.content,
      });

      const vectorResult = response.data;
      console.log(`Vectorization result for memo ${memoId}:`, vectorResult);

      // 엘라스틱서치에 벡터 저장
      await this._saveVectorToElasticsearch(memo._id, vectorResult.vectors);
      return memo;
    } catch (error) {
      throw new Error(`Vectorization failed: ${error.message}`);
    }
  }

  // 요약
  async summarizeText(data) {
    // data 요약 과정
    const result = "";
    return result;
  }
  async summarizeImage(data) {
    // data 요약 과정
    const result = "";
    return result;
  }
}

export default memoService;
