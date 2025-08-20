import {ForbiddenError, ConflictError} from "../../../utils/customError.js";
import {CATEGORY_MESSAGES} from "../../../constants/message.js";
import {getCategoryAndCheckPermission} from "../../../utils/permissionCheck.js";

class CategoryService {
  constructor(categoryRepository, memoService) {
    this.categoryRepository = categoryRepository;
    this.memoService = memoService;
  }

  async _isTitleExists(title, createdBy, excludeCategoryId = null) {
    const query = {title, createdBy};
    if (excludeCategoryId) {
      query._id = {$ne: excludeCategoryId};
    }
    const existingTitle = await this.categoryRepository.exists(query);
    if (existingTitle) {
      throw new ConflictError(CATEGORY_MESSAGES.DUPLICATE_TITLE);
    }
  }

  // 카테고리 생성
  async createCategory(data) {
    const {title, createdBy, parentCategoryId, color} = data;
    await this._isTitleExists(title, createdBy);
    const categoryData = {title, createdBy, parentCategoryId, color};
    const newCategory = await this.categoryRepository.create(categoryData);
    return newCategory;
  }

  // 카테고리 목록, 메모 개수 조회
  async getCategories(data) {
    const {createdBy, parentCategoryId} = data;
    return this.categoryRepository.findWithMemoCount(createdBy, parentCategoryId);
  }

  // 카테고리 제목 업데이트
  async updateCategoryTitle(data) {
    const {categoryId, title, createdBy} = data;
    await getCategoryAndCheckPermission(categoryId, createdBy);
    await this._isTitleExists(title, createdBy, categoryId);
    const filter = {
      _id: categoryId,
      createdBy: createdBy,
    };
    const update = {$set: {title: title}};
    const updatedCategory = await this.categoryRepository.updateOne(filter, update);

    return updatedCategory;
  }

  // 카테고리 색상 업데이트
  async updateCategoryColor(data) {
    const {categoryIds, color, createdBy} = data;
    await getCategoryAndCheckPermission(categoryIds, createdBy);
    const filter = {
      _id: {$in: categoryIds},
      createdBy: createdBy,
    };
    const update = {$set: {color: color}};
    const updatedCategories = await this.categoryRepository.updateMany(filter, update);

    return updatedCategories;
  }

  // 카테고리 이동 -> 그냥 child category 없게 수정
  async moveCategory(data) {
    // permission 체크
    const {categoryIds, newCategoryId, createdBy} = data;
    await getCategoryAndCheckPermission([...categoryIds, newCategoryId], createdBy);

    const updatedMemos = await this.memoService.moveMemosByCategoryIds(data);
    return updatedMemos;
  }

  // 카테고리 삭제
  async deleteCategories(data) {
    const {categoryIds, createdBy} = data;
    const categoriesToDelete = await this.categoryRepository.findManyByUserIdAndCategoryIds(categoryIds, createdBy);

    if (categoriesToDelete.length !== categoryIds.length) {
      throw new ForbiddenError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
    }
    await this.memoService.deleteMemosByCategoryIds(categoryIds);
    await this.categoryRepository.deleteMany({_id: {$in: categoryIds}});
    return {message: "카테고리 삭제 완료"};
  }
}

export default CategoryService;
