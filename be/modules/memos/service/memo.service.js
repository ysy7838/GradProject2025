import {NotFoundError, InternalServerError, BadRequestError} from "../../../utils/customError.js";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import {COMMON_MESSAGES} from "../../../constants/message.js";
import {getCategoryAndCheckPermission} from "../../../utils/permissionCheck.js";
import {spawn} from "child_process";
import path from "path";
import {fileURLToPath} from "url";
import axios from "axios";
import GeminiService from "./gemini.service.js";

class memoService {
  constructor(memoRepository, tagService, elasticClient, permissionCheckHelper, geminiService) {
    this.memoRepository = memoRepository;
    this.tagService = tagService;
    this.elasticClient = elasticClient;
    this.permissionCheckHelper = permissionCheckHelper;
    this.geminiService = geminiService;
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

  /* 메모 내용 요약 (텍스트 및 이미지 통합 요약) 3*/
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

  // 권한 확인 헬퍼 메서드 (기존 코드에서 가져옴)
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

export default memoService;