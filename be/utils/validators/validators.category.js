import { check } from "express-validator";
import {validateMiddleware, validateObjectId, validateObjectIdArray} from "./validators.common.js";
import { CATEGORY_MESSAGES } from "../../constants/message.js";

// title
export const validateTitle = check("title").trim().isLength({max: 50}).withMessage(CATEGORY_MESSAGES.INVALID_TITLE_LENGTH);

// [Category]
export const validateCreateCategory = [validateTitle, validateMiddleware];

export const validateUpdateCategoryTitle = [validateObjectId("categoryId"), validateTitle, validateMiddleware];

export const validateUpdateCategoriesColor = [validateObjectIdArray("categoryIds"), validateMiddleware];

export const validateMoveCategories = [
  validateObjectId("categoryIds"),
  validateObjectId("newCategoryId"),
  validateMiddleware,
];

export const validateDeleteCategories = [validateObjectIdArray("categoryIds"), validateMiddleware];
