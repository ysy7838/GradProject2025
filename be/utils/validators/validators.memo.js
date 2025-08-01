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

// [Memo]
export const validateGetMemoList = [validateCategoryId, validateMiddleware];

export const validateCreateMemo = [validateTitle, validateContent, validateCategoryId, validateMiddleware];

export const validateGetMemo = [validateMemoId, validateMiddleware];

export const validateUpdateMemo = [validateMemoId, validateTitle, validateContent, validateMiddleware];

export const validateUpdateMemoFav = [
  validateMemoIds,
  check("isFavorite").isBoolean().withMessage(MEMO_MESSAGES.INVALID_FAV_STATUS),
  validateMiddleware,
];

export const validateCopyMemo = [validateMemoId, validateMiddleware];

export const validateMoveMemos = [validateMemoIds, validateMiddleware];

export const validateDeleteMemos = [validateMemoIds, validateMiddleware];
