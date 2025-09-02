import {NotFoundError} from "./customError.js";
import {CATEGORY_MESSAGES} from "../constants/message.js";

export const getCategoryAndCheckPermission = (categoryRepository) => {
  return async (categoryIdsOrId, createdBy) => {
    let queryCondition;
    let categories;

    if (Array.isArray(categoryIdsOrId)) {
      queryCondition = {_id: {$in: categoryIdsOrId}, createdBy};
      categories = await categoryRepository.findManyByQuery(queryCondition);
      if (categories.length !== categoryIdsOrId.length) {
        throw new NotFoundError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
      }
    } else {
      queryCondition = {_id: categoryIdsOrId, createdBy};
      categories = await categoryRepository.findOneByQuery(queryCondition);
      if (!categories) {
        throw new NotFoundError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
      }
    }
    return categories;
  };
};
