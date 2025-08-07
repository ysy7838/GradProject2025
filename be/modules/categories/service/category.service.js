import categoryRepository from "../repository/category.repository.js";
import memoRepository from "../../memos/repository/memo.repository.js";
import {BadRequestError, ForbiddenError, ConflictError, NotFoundError} from "../../../utils/customError.js";
import {CATEGORY_MESSAGES} from "../../../constants/message.js";

class CategoryService {
  constructor() {
    this.categoryRepository = categoryRepository;
    this.memoRepository = memoRepository;
  }

  // 헬퍼 함수
  async _getCategoryAndCheckPermission(categoryIdsOrId, createdBy) {
    let queryCondition;
    let categories;

    if (Array.isArray(categoryIdsOrId)) {
      queryCondition = {_id: {$in: categoryIdsOrId}, createdBy};
      categories = await this.categoryRepository.findManyByQuery(queryCondition);
      if (categories.length !== categoryIdsOrId.length) {
        throw new NotFoundError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
      }
    } else {
      queryCondition = {_id: categoryIdsOrId, createdBy};
      categories = await this.categoryRepository.findOneByQuery(queryCondition);
      if (!categories) {
        throw new NotFoundError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
      }
    }
    return categories;
  }

  async getCategoryAndCheckPermission(categoryId, createdBy) {
    return this._getCategoryAndCheckPermission(categoryId, createdBy);
  }

  async getCategoriesAndCheckPermission(categoryIds, createdBy) {
    return this._getCategoryAndCheckPermission(categoryIds, createdBy);
  }

  async _isTitleExists(title, createdBy, parentCategoryId = null) {
    const existingTitle = await this.categoryRepository.findExistingTitle(title, createdBy, parentCategoryId);
    if (existingTitle) {
      throw new ConflictError(CATEGORY_MESSAGES.DUPLICATE_TITLE);
    }
  }

  // 카테고리 생성
  async createCategory(title, createdBy, parentCategoryId = null, color) {
    await this._isTitleExists(title, createdBy, parentCategoryId);
    const order = await this.categoryRepository.findMaxOrder(createdBy, parentCategoryId);
    const categoryData = {title, createdBy, parentCategoryId, order, color};

    const newCategory = await this.categoryRepository.create(categoryData);
    return newCategory;
  }

  // 카테고리 목록, 메모 개수 조회
  async getCategories(createdBy, parentCategoryId = null) {
    return this.categoryRepository.findWithMemoCount(createdBy, parentCategoryId);
  }

  async updateCategoryFields(categoryIds, updatePayload, createdBy) {
    // validator으로 처리 하기
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new BadRequestError(CATEGORY_MESSAGES.INVALID_CATEGORY_IDS);
    }
    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestError(CATEGORY_MESSAGES.NO_UPDATE_FIELDS);
    }
    // 여기까지
    const accessibleCategories = await this.categoryRepository.findManyBycreatedByAndCategoryIds(
      categoryIds,
      createdBy
    );

    if (accessibleCategories.length !== categoryIds.length) {
      throw new ForbiddenError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
    }

    // updatePayload에 따라 추가 유효성 검사 및 로직 수행
    if (updatePayload.title) {
      if (categoryIds.length > 1) {
        throw new BadRequestError(CATEGORY_MESSAGES.CANNOT_UPDATE_MULTIPLE_TITLES);
      }
      const existingTitle = await this.categoryRepository.findExistingTitle(
        updatePayload.title,
        createdBy,
        categoryIds[0]
      );
      if (existingTitle) {
        throw new ConflictError(CATEGORY_MESSAGES.DUPLICATE_TITLE);
      }
    }

    if ("parentCategoryId" in updatePayload) {
      const newParentCategoryId = updatePayload.parentCategoryId || null;
      if (newParentCategoryId !== null) {
        const targetParentCategory = await this.categoryRepository.findOneBycreatedByAndCategoryId(
          newParentCategoryId,
          createdBy
        );
        if (!targetParentCategory) {
          throw new NotFoundError(CATEGORY_MESSAGES.TARGET_CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
        }
        // TODO: 순환 참조 방지 로직 구현 (카테고리가 자신의 하위 카테고리로 이동하는 것을 방지)
        // ex) categoriesToMove 중 하나라도 newParentCategoryId의 조상인지 확인
      }

      // 위치 변경 시 order 값 재설정 (여기서는 단일 카테고리 이동만 고려하여 간단히 구현)
      if (categoryIds.length === 1) {
        const maxOrder = await this.categoryRepository.findMaxOrder(createdBy, newParentCategoryId);
        updatePayload.order = maxOrder + 1; // updatePayload에 order 필드 추가
        console.log(updatePayload.order);
      } else {
        // 여러 카테고리를 이동할 때의 order 재정렬 로직 필요
        throw new BadRequestError(CATEGORY_MESSAGES.CANNOT_MOVE_MULTIPLE_CATEGORIES);
      }
    }

    const query = {_id: {$in: categoryIds}};
    const result = await this.categoryRepository.updateMany(query, {$set: updatePayload}, {runValidators: true});
    return result;
  }

  // 카테고리 업데이트
  async updateCategoryTitle(categoryId, title, createdBy) {
    return this.updateCategoryFields([categoryId], {title: title}, createdBy);
  }

  async updateCategoryColor(categoryIds, color, createdBy) {
    return this.updateCategoryFields(categoryIds, {color: color}, createdBy);
  }

  async moveCategory(categoryIdToMove, newParentCategoryId, createdBy) {
    return this.updateCategoryFields([categoryIdToMove], {parentCategoryId: newParentCategoryId}, createdBy);
  }

  // 카테고리 삭제 => 수정 필요
  async deleteCategories(categoryIds, createdBy) {
    const categoriesToDelete = await this.categoryRepository.findManyBycreatedByAndCategoryIds(categoryIds, createdBy);

    if (categoriesToDelete.length !== categoryIds.length) {
      throw new ForbiddenError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND_OR_NO_PERMISSION);
    }
    // 해당 카테고리에 연결된 메모 및 관련 데이터 삭제
    // 예시: await this.memoRepository.deleteManyByCategories(categoryIds);
    await this.categoryRepository.deleteMany({_id: {$in: categoryIds}});
    return {message: "카테고리 삭제 완료"};
  }
}

export default new CategoryService();
