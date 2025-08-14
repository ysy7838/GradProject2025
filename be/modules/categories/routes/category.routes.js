import {Router} from "express";
import categoryController from "../controller/category.controller.js";
import {authenticate} from "../../../middlewares/authenticate.js";
import {
  validateCreateCategory,
  validateUpdateCategoryTitle,
  validateUpdateCategoriesColor,
  validateMoveCategories,
  validateDeleteCategories,
} from "../../../utils/validators/validators.category.js";

const router = Router();

// 생성
router.post("/", authenticate, validateCreateCategory, categoryController.createCategory);

// 조회
router.get("/", authenticate, categoryController.getCategories);

// 삭제 (최소 1개)
router.delete("/", authenticate, validateDeleteCategories, categoryController.deleteCategories);

// 업데이트
// 색상 (최소 1개)
router.patch("/color", authenticate, validateUpdateCategoriesColor, categoryController.updateCategoriesColor);

// 이동: 내부 메모 -> 타 카테고리 (최소 1개)
router.patch("/move", authenticate, validateMoveCategories, categoryController.moveCategory);

// 이름 (1개)
router.patch("/:categoryId/title", authenticate, validateUpdateCategoryTitle, categoryController.updateCategoryTitle);

export default router;
