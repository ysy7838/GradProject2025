import {check} from "express-validator";
import {validateMiddleware, validateObjectId, validateObjectIdArray} from "./validators.common.js";
import {MEMO_MESSAGES} from "../../constants/message.js";
import {validateTags} from "./validators.tag.js";

// API 스펙에 맞춘 필드명 사용
// title (API 스펙: 1~20자)
export const validateTitle = check("title")
  .trim()
  .isLength({min: 1, max: 20})
  .withMessage("제목은 1~20자 사이로 입력해주세요.");

// memo (API 스펙: 최대 500자, content 대신 memo 사용)
export const validateMemoContent = check("memo")
  .optional()
  .isString()
  .withMessage(MEMO_MESSAGES.INVALID_CONTENT_TYPE)
  .isLength({max: 500})
  .withMessage("메모 내용은 최대 500자까지 입력 가능합니다.");

// collectionId (API 스펙에서는 collectionId 사용, 내부적으로는 categoryId로 처리)
export const validateCollectionId = check("collectionId")
  .isMongoId()
  .withMessage("유효하지 않은 컬렉션 ID입니다.");

// keywords (쉼표로 구분된 문자열, 각 키워드는 최대 15자)
export const validateKeywords = check("keywords")
  .optional()
  .isString()
  .withMessage("키워드는 문자열 형식이어야 합니다.")
  .custom((value) => {
    if (value) {
      const keywords = value.split(',').map(k => k.trim());
      if (keywords.length > 5) {
        throw new Error("키워드는 최대 5개까지 입력 가능합니다.");
      }
      for (const keyword of keywords) {
        if (keyword.length > 15) {
          throw new Error("각 키워드는 최대 15자까지 입력 가능합니다.");
        }
      }
    }
    return true;
  });

// links (HTTP/HTTPS URL 배열)
export const validateLinks = check("links")
  .optional()
  .isArray()
  .withMessage("링크는 배열 형식이어야 합니다.")
  .custom((links) => {
    if (links && Array.isArray(links)) {
      for (const link of links) {
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          throw new Error("링크는 HTTP 또는 HTTPS로 시작해야 합니다.");
        }
      }
    }
    return true;
  });

// memoId
export const validateMemoId = validateObjectId("memoId").notEmpty().withMessage(MEMO_MESSAGES.INVALID_MEMO_ID);

// memoIds
export const validateMemoIds = validateObjectIdArray("memoIds");

// [Memo] - API 스펙에 맞춘 검증 규칙들
export const validateGetMemoList = [validateCollectionId, validateMiddleware];

export const validateCreateMemo = [
  validateCollectionId,
  validateTitle,
  validateKeywords,
  validateMemoContent,
  validateLinks,
  validateMiddleware
];

export const validateGetMemo = [validateMemoId, validateMiddleware];

export const validateUpdateMemo = [
  validateMemoId,
  check("title").optional().trim().isLength({min: 1, max: 20}).withMessage("제목은 1~20자 사이로 입력해주세요."),
  check("memo").optional().isString().withMessage(MEMO_MESSAGES.INVALID_CONTENT_TYPE).isLength({max: 500}).withMessage("메모 내용은 최대 500자까지 입력 가능합니다."),
  validateKeywords,
  validateLinks,
  validateMiddleware
];

export const validateUpdateMemoFav = [
  validateMemoIds,
  check("isFavorite").isBoolean().withMessage(MEMO_MESSAGES.INVALID_FAV_STATUS),
  validateMiddleware,
];

export const validateCopyMemo = [validateMemoId, validateMiddleware];

export const validateMoveMemos = [
  validateMemoIds,
  check("categoryId").isMongoId().withMessage("유효하지 않은 카테고리 ID입니다."),
  validateMiddleware
];

export const validateDeleteMemos = [validateMemoIds, validateMiddleware];