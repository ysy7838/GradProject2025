import {NotFoundError, InternalServerError, BadRequestError} from "../../../utils/customError.js";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import {COMMON_MESSAGES} from "../../../constants/message.js";
import {getCategoryAndCheckPermission} from "../../../utils/permissionCheck.js";
import {spawn} from "child_process";
import path from "path";
import {fileURLToPath} from "url";
import axios from "axios";
import GeminiService from "./gemini.service.js";

class MemoService {
  constructor(memoRepository, tagService, elasticClient, permissionCheckHelper, geminiService) {
    this.memoRepository = memoRepository;
    this.tagService = tagService;
    this.elasticClient = elasticClient;
    this.permissionCheckHelper = permissionCheckHelper;
    this.geminiService = geminiService;
  }

  /* 메모 생성 */
  async createMemo(data) {
    const {title, content, categoryId, createdBy, tags} = data;
    
    // 카테고리 권한 확인
    if (categoryId) {
      await this.permissionCheckHelper(categoryId, createdBy);
    }

    // 태그 처리
    let tagIds = [];
    if (tags && tags.length > 0) {
      const tagPromises = tags.map(tagName => this.tagService.findOrCreateTag(tagName));
      const createdTags = await Promise.all(tagPromises);
      tagIds = createdTags.map(tag => tag._id);
    }

    // 메모 생성
    const memoData = {
      title,
      content,
      categoryId,
      createdBy,
      tags: tagIds
    };

    const newMemo = await this.memoRepository.create(memoData);
    
    // 태그 사용 카운트 증가
    if (tagIds.length > 0) {
      await this.tagService.incrementTagUsage(tagIds);
    }

    return newMemo;
  }

  /* 메모 목록 조회 */
  async getMemoList(data) {
    const {categoryId, createdBy} = data;
    
    // 카테고리 권한 확인
    if (categoryId) {
      await this.permissionCheckHelper(categoryId, createdBy);
    }

    const filter = {
      createdBy,
      ...(categoryId && {categoryId})
    };

    const memos = await this.memoRepository.find(filter, null, {sort: {updatedAt: -1}});
    return memos;
  }

  /* 메모 상세 조회 */
  async getMemoDetail(data) {
    const {memoId, createdBy} = data;
    const memo = await this._getMemoAndCheckPermission(memoId, createdBy);
    return memo;
  }

  /* 메모 수정 */
  async updateMemo(data) {
    const {memoId, title, content, createdBy, tags} = data;
    
    // 메모 권한 확인
    const existingMemo = await this._getMemoAndCheckPermission(memoId, createdBy);
    
    // 기존 태그 처리
    const oldTagIds = existingMemo.tags.map(tag => tag._id);
    
    // 새 태그 처리
    let newTagIds = [];
    if (tags && tags.length > 0) {
      const tagPromises = tags.map(tagName => this.tagService.findOrCreateTag(tagName));
      const createdTags = await Promise.all(tagPromises);
      newTagIds = createdTags.map(tag => tag._id);
    }

    // 메모 업데이트
    const updateData = {
      ...(title !== undefined && {title}),
      ...(content !== undefined && {content}),
      tags: newTagIds
    };

    const updatedMemo = await this.memoRepository.updateOne(
      {_id: memoId},
      updateData
    );

    // 태그 사용 카운트 업데이트
    if (oldTagIds.length > 0) {
      await this.tagService.decrementTagUsage(oldTagIds);
    }
    if (newTagIds.length > 0) {
      await this.tagService.incrementTagUsage(newTagIds);
    }

    return updatedMemo;
  }

  /* 메모 즐겨찾기 업데이트 */
  async updateMemosFav(data) {
    const {memoIds, createdBy, isFavorite} = data;
    
    // 메모 권한 확인
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    
    const result = await this.memoRepository.updateMany(
      {_id: {$in: memoIds}, createdBy},
      {isFavorite}
    );

    return result;
  }

  /* 메모 복사 */
  async copyMemo(data) {
    const {memoId, createdBy} = data;
    
    // 원본 메모 조회 및 권한 확인
    const originalMemo = await this._getMemoAndCheckPermission(memoId, createdBy);
    
    // 복사본 생성
    const copyData = {
      title: `${originalMemo.title} (복사)`,
      content: originalMemo.content,
      categoryId: originalMemo.categoryId,
      createdBy,
      tags: originalMemo.tags.map(tag => tag._id)
    };

    const copiedMemo = await this.memoRepository.create(copyData);
    
    // 태그 사용 카운트 증가
    if (copyData.tags.length > 0) {
      await this.tagService.incrementTagUsage(copyData.tags);
    }

    return copiedMemo;
  }

  /* 메모 이동 */
  async moveMemos(data) {
    const {memoIds, categoryId, createdBy} = data;
    
    // 메모와 대상 카테고리 권한 확인
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    if (categoryId) {
      await this.permissionCheckHelper(categoryId, createdBy);
    }

    const result = await this.memoRepository.updateMany(
      {_id: {$in: memoIds}, createdBy},
      {categoryId}
    );

    return result;
  }

  /* 카테고리별 메모 이동 */
  async moveMemosByCategoryIds(data) {
    const {categoryIds, newCategoryId, createdBy} = data;
    
    const result = await this.memoRepository.updateMany(
      {categoryId: {$in: categoryIds}, createdBy},
      {categoryId: newCategoryId}
    );

    return result;
  }

  /* 메모 삭제 */
  async deleteMemos(data) {
    const {memoIds, createdBy} = data;
    
    // 메모 권한 확인
    const memos = await this._getMemoAndCheckPermission(memoIds, createdBy);
    
    // 태그 사용 카운트 감소
    const allTagIds = [];
    memos.forEach(memo => {
      if (memo.tags && memo.tags.length > 0) {
        allTagIds.push(...memo.tags.map(tag => tag._id));
      }
    });
    
    if (allTagIds.length > 0) {
      await this.tagService.decrementTagUsage(allTagIds);
    }

    // 메모 삭제
    const result = await this.memoRepository.deleteMany({
      _id: {$in: memoIds},
      createdBy
    });

    return result;
  }

  /* 카테고리별 메모 삭제 */
  async deleteMemosByCategoryIds(categoryIds) {
    const memos = await this.memoRepository.find({categoryId: {$in: categoryIds}});
    
    // 태그 사용 카운트 감소
    const allTagIds = [];
    memos.forEach(memo => {
      if (memo.tags && memo.tags.length > 0) {
        allTagIds.push(...memo.tags.map(tag => tag._id));
      }
    });
    
    if (allTagIds.length > 0) {
      await this.tagService.decrementTagUsage(allTagIds);
    }

    // 메모 삭제
    const result = await this.memoRepository.deleteMany({categoryId: {$in: categoryIds}});
    return result;
  }

  /* 해시태그 자동 생성 */
  async makeHashtags(memoId) {
    // TODO: 구현 필요
    return {message: "해시태그 생성 기능은 추후 구현 예정입니다."};
  }

  /* 메모 벡터 변환 */
  async convertToVec(memoId) {
    // TODO: 구현 필요
    return {message: "벡터 변환 기능은 추후 구현 예정입니다."};
  }

  /* 텍스트 요약 - Gemini AI */
  async summarizeText(data) {
    try {
      // content만 전달
      const content = typeof data === 'string' ? data : data.content;
      if (!content || typeof content !== 'string') {
        throw new BadRequestError("요약할 텍스트 내용이 제공되지 않았습니다.");
      }
      const result = await this.geminiService.summarizeText(content);
      return {
        success: true,
        summary: result.summary,
        originalLength: result.originalLength,
        summaryLength: result.summaryLength,
        type: "text",
        timestamp: result.timestamp
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
      const { imageData } = data;
      if (!imageData) {
        throw new BadRequestError("요약할 이미지 데이터가 제공되지 않았습니다.");
      }
      // 이미지 데이터 형식 검증
      if (!imageData.data || !imageData.mimeType) {
        throw new BadRequestError("이미지 데이터 형식이 올바르지 않습니다. data와 mimeType이 필요합니다.");
      }
      // 지원하는 이미지 형식 검증
      const supportedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 
        'image/gif', 'image/webp', 'image/bmp'
      ];
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
        timestamp: result.timestamp
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
      const { imageData, s3Url, memoId, createdBy } = data;
      
      // 1. 이미지 요약 생성
      const summaryResult = await this.geminiService.summarizeImage(imageData);
      
      // 2. 메모가 있다면 이미지 URL 저장
      if (memoId) {
        const memo = await this._getMemoAndCheckPermission(memoId, createdBy);
        
        // 메모에 이미지 URL 추가 (images 필드 추가 필요)
        const updatedMemo = await this.memoRepository.updateOne(
          { _id: memoId },
          { 
            $push: { 
              images: {
                url: s3Url,
                summary: summaryResult.summary,
                uploadedAt: new Date()
              }
            }
          }
        );
      }
      
      return {
        success: true,
        summary: summaryResult.summary,
        imageUrl: s3Url,
        imageType: summaryResult.imageType,
        summaryLength: summaryResult.summaryLength,
        type: "image",
        timestamp: summaryResult.timestamp
      };

    } catch (error) {
      console.error("Image summarization with S3 error:", error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new InternalServerError("이미지 요약 처리 중 오류가 발생했습니다.");
    }
  }

  /* 다중 이미지 요약 (이미지 그룹용) */
  async summarizeMultipleImages(data) {
    try {
      const { imageDataArray } = data;
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
        timestamp: result.timestamp
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
      const { memoId, createdBy } = data;

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
            imageData: memo.images[0]
          });
          imageSummaries.push(imageSummary);
        } else {
          const multiImageSummary = await this.summarizeMultipleImages({
            imageDataArray: memo.images
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
          imageCount: memo.images ? memo.images.length : 0
        }
      };

      if (textSummary) {
        combinedSummary.textSummary = {
          summary: textSummary.summary,
          originalLength: textSummary.originalLength,
          summaryLength: textSummary.summaryLength
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

  // 권한 확인 헬퍼 메서드
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
}

export default MemoService;