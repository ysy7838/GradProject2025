// modules/categories/category.controller.js
import categoryService from "./category.service.js";
import asyncHandler from "express-async-handler";
import {CATEGORY_MESSAGES} from "../../constants/message.js";

class CategoryController {
  constructor() {
    this.categoryService = categoryService;

    this.createCategory = asyncHandler(this.createCategory.bind(this));
    this.getCategories = asyncHandler(this.getCategories.bind(this));
    this.updateCategoryTitle = asyncHandler(this.updateCategoryTitle.bind(this));
    this.updateCategoriesColor = asyncHandler(this.updateCategoriesColor.bind(this));
    this.moveCategory = asyncHandler(this.moveCategory.bind(this));
    this.deleteCategories = asyncHandler(this.deleteCategories.bind(this));
  }

  // POST /api/categories
  async createCategory(req, res) {
    const {title, parentCategoryId, color} = req.body;
    const createdBy = req.user.id;
    const newCategory = await this.categoryService.createCategory(title, createdBy, parentCategoryId, color);

    res.status(201).json({
      message: CATEGORY_MESSAGES.CREATE_SUCCESS,
      category: newCategory,
    });
  }

  // GET /api/categories
  async getCategories(req, res) {
    const createdBy = req.user.id;
    const {parentCategoryId} = req.query;
    const categories = await this.categoryService.getCategories(createdBy, parentCategoryId || null);

    res.status(200).json({
      message: CATEGORY_MESSAGES.GET_SUCCESS,
      categories: categories,
      count: categories.length,
    });
  }

  // PATCH /api/categories/:categoryId/title
  async updateCategoryTitle(req, res) {
    const {categoryId} = req.params;
    const {title} = req.body;
    const createdBy = req.user.id;

    const result = await this.categoryService.updateCategoryTitle(categoryId, title, createdBy);

    if (result && result.modifiedCount > 0) {
      res.status(200).json({
        message: CATEGORY_MESSAGES.UPDATE_TITLE_SUCCESS,
        modifiedCount: result.modifiedCount,
        category: result.categories ? result.categories[0] : undefined,
      });
    } else {
      res.status(200).json({message: CATEGORY_MESSAGES.NO_CHANGE});
    }
  }

  // PATCH /api/categories/color
  async updateCategoriesColor(req, res) {
    const {categoryIds, color} = req.body;
    const createdBy = req.user.id;
    const result = await this.categoryService.updateCategoryColor(categoryIds, color, createdBy);

    if (result && result.modifiedCount > 0) {
      res.status(200).json({
        message: CATEGORY_MESSAGES.UPDATE_COLOR_SUCCESS,
        modifiedCount: result.modifiedCount,
        category: result.categories,
      });
    } else {
      res.status(200).json({message: CATEGORY_MESSAGES.NO_CHANGE});
    }
  }

  // PATCH /api/categories/move 수정 필요
  async moveCategory(req, res) {
    const {categoryIds, newParentCategoryId} = req.body;
    const createdBy = req.user.id;

    const result = await this.categoryService.moveCategory(categoryIds, newParentCategoryId, createdBy);

    if (result && result.modifiedCount > 0) {
      res.status(200).json({
        message: CATEGORY_MESSAGES.MOVE_SUCCESS,
        modifiedCount: result.modifiedCount,
        category: result.categories ? result.categories[0] : undefined,
      });
    } else {
      res.status(200).json({message: CATEGORY_MESSAGES.NO_CHANGE});
    }
  }

  // DELETE /api/categories
  async deleteCategories(req, res) {
    const {categoryIds} = req.body;
    const createdBy = req.user.id;
    const result = await this.categoryService.deleteCategories(categoryIds, createdBy);
    res.status(200).json({message: CATEGORY_MESSAGES.DELETE_SUCCESS});
  }
}

// asyncHandler 래핑 -> try-catch 블록 제거
Object.keys(CategoryController.prototype).forEach((key) => {
  if (typeof CategoryController.prototype[key] === "function" && key !== "constructor") {
    CategoryController.prototype[key] = asyncHandler(CategoryController.prototype[key]);
  }
});

export default new CategoryController();