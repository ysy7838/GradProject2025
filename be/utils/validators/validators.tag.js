// utils/validate.tag.js
import {body} from "express-validator";
import {TAG_MESSAGES} from "../../constants/message.js";

// tags 배열 유효성 검사
export const validateTags = [
  body("tags").optional().isArray({min: 0, max: 5}).withMessage(TAG_MESSAGES.TAG_LIMIT_EXCEEDED),
  body("tags.*")
    .optional()
    .isString()
    .withMessage(TAG_MESSAGES.INVALID_TAG_FORMAT)
    .trim()
    .isLength({min: 1, max: 15})
    .withMessage(TAG_MESSAGES.INVALID_TAG_FORMAT),
]