import {check} from "express-validator";
import {validateMiddleware, validateObjectId, validateObjectIdArray} from "./validators.common.js";
import {MEMO_MESSAGES, TAG_MESSAGES} from "../../constants/message.js";
import {validateTags} from "./validators.tag.js";

// title
export const validateTitle = check("title").trim().isLength({max: 100}).withMessage(MEMO_MESSAGES.INVALID_TITLE_LENGTH);

// content
export const validateContent = check("content").optional().isString().withMessage(MEMO_MESSAGES.INVALID_CONTENT_TYPE);

// categoryId
export const validateCategoryId = validateObjectId("categoryId").optional();

// keywords (tag validation과 동일한 규칙 적용)
export const validateKeywords = check("keywords")
  .optional()
  .isString()
  .withMessage("키워드는 문자열 형식이어야 합니다.")
  .custom((value) => {
    if (value) {
      const keywords = value.split(",").map((k) => k.trim());
      // tag validation과 동일한 규칙 적용 (최대 5개, 각 15자)
      if (keywords.length > 5) {
        throw new Error(TAG_MESSAGES.TAG_LIMIT_EXCEEDED);
      }
      for (const keyword of keywords) {
        if (keyword.length < 1 || keyword.length > 15) {
          throw new Error(TAG_MESSAGES.INVALID_TAG_FORMAT);
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
        if (!link.startsWith("http://") && !link.startsWith("https://")) {
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
export const validateGetMemoList = [validateCategoryId, validateMiddleware];

export const validateCreateMemo = [
  validateCategoryId,
  validateTitle,
  validateKeywords,
  validateContent,
  validateLinks,
  validateMiddleware,
];

export const validateGetMemo = [validateMemoId, validateMiddleware];

export const validateUpdateMemo = [
  validateMemoId,
  validateTitle.optional(),
  validateContent,
  validateKeywords,
  validateLinks,
  validateMiddleware,
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
  validateMiddleware,
];

export const validateDeleteMemos = [validateMemoIds, validateMiddleware];
