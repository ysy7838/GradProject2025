import categoryService from "../service/category.service.js";
import asyncHandler from "express-async-handler";
import {CATEGORY_MESSAGES} from "../../../constants/message.js";

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
    const {title, parentCategoryId = null, color} = req.body;
    const createdBy = req.user.id;
    const data = {title, createdBy, parentCategoryId, color};

    const newCategory = await this.categoryService.createCategory(data);

    res.status(201).json({
      message: CATEGORY_MESSAGES.CREATE_SUCCESS,
      category: newCategory,
    });
  }

  // GET /api/categories
  async getCategories(req, res) {
    const createdBy = req.user.id;
    const {parentCategoryId = null} = req.query;
    const data = {createdBy, parentCategoryId};

    const categories = await this.categoryService.getCategories(data);

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
    const data = {categoryId, title, createdBy};

    const result = await this.categoryService.updateCategoryTitle(data);

    res.status(200).json({
      message: CATEGORY_MESSAGES.UPDATE_TITLE_SUCCESS,
      modifiedCount: result.modifiedCount,
    });
  }

  // PATCH /api/categories/color
  async updateCategoriesColor(req, res) {
    const {categoryIds, color} = req.body;
    const createdBy = req.user.id;
    const data = {categoryIds, color, createdBy};
    const result = await this.categoryService.updateCategoryColor(data);

    res.status(200).json({
      message: CATEGORY_MESSAGES.UPDATE_COLOR_SUCCESS,
      modifiedCount: result.modifiedCount,
    });
  }

  // PATCH /api/categories/move 수정 필요
  async moveCategory(req, res) {
    const {categoryIds, newParentCategoryId} = req.body;
    const createdBy = req.user.id;
    const data = {categoryIds, newParentCategoryId, createdBy};

    const result = await this.categoryService.moveCategory(data);

    res.status(200).json({
      message: CATEGORY_MESSAGES.MOVE_SUCCESS,
      modifiedCount: result.modifiedCount,
    });
  }

  // DELETE /api/categories
  async deleteCategories(req, res) {
    const {categoryIds} = req.body;
    const createdBy = req.user.id;
    const data = {categoryIds, createdBy};
    
    await this.categoryService.deleteCategories(data);
    
    res.status(200).json({message: CATEGORY_MESSAGES.DELETE_SUCCESS});
  }
}

export default new CategoryController();
