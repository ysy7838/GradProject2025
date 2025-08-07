import {check} from "express-validator";
import {validateMiddleware, validateObjectId, validateObjectIdArray} from "./validators.common.js";
import {MEMO_MESSAGES} from "../../constants/message.js";

// title
export const validateTitle = check("title").trim().isLength({max: 100}).withMessage(MEMO_MESSAGES.INVALID_TITLE_LENGTH);

// content
export const validateContent = check("content").optional().isString().withMessage(MEMO_MESSAGES.INVALID_CONTENT_TYPE);

// categoryId
export const validateCategoryId = validateObjectId("categoryId");

// memoId
export const validateMemoId = validateObjectId("memoId").notEmpty().withMessage(MEMO_MESSAGES.INVALID_MEMO_ID);

// memoIds
export const validateMemoIds = validateObjectIdArray("memoIds");

// tags
export const validateTags = check("tags")
  .optional()
  .isArray({ min: 0, max: 5 })
  .withMessage("태그는 최대 5개까지 추가할 수 있습니다.")
  .custom((tags) => {
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (typeof tag !== "string" || tag.trim().length === 0 || tag.trim().length > 15) {
          throw new Error("태그는 1-15자 사이의 문자열이어야 합니다.");
        }
      }
    }
    return true;
  });

// tagName (검색용)
export const validateTagName = check("tagName")
  .optional()
  .isString()
  .trim()
  .isLength({ min: 1, max: 15 })
  .withMessage("태그명은 1-15자 사이여야 합니다.");

// [Memo]
export const validateGetMemoList = [validateCategoryId, validateMiddleware];

export const validateCreateMemo = [validateTitle, validateContent, validateCategoryId, validateTags, validateMiddleware];

export const validateGetMemo = [validateMemoId, validateMiddleware];

export const validateUpdateMemo = [validateMemoId, validateTitle, validateContent, validateTags, validateMiddleware];

export const validateUpdateMemoFav = [
  validateMemoIds,
  check("isFavorite").isBoolean().withMessage(MEMO_MESSAGES.INVALID_FAV_STATUS),
  validateMiddleware,
];

export const validateCopyMemo = [validateMemoId, validateMiddleware];

export const validateMoveMemos = [validateMemoIds, validateMiddleware];

export const validateDeleteMemos = [validateMemoIds, validateMiddleware];

export const validateSearchByTag = [validateTagName, validateMiddleware];
