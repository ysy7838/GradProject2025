import {Router} from "express";
import categoryController from "../controller/category.controller.js";
import {authenticate} from "../../../middlewares/authenticate.js";
import {
  validateCreateCategory,
  validateUpdateCategoryTitle,
  validateUpdateCategoriesColor,
  validateMoveCategory,
  validateDeleteCategories,
} from "../../../utils/validators/validators.category.js";

const router = Router();

// 생성
router.post("/", authenticate, validateCreateCategory, categoryController.createCategory);

// 조회
router.get("/", authenticate, categoryController.getCategories);

// 이름 업데이트
router.patch("/:categoryId/title", authenticate, validateUpdateCategoryTitle, categoryController.updateCategoryTitle);

// 색상 업데이트 (최소 1개)
router.patch("/color", authenticate, validateUpdateCategoriesColor, categoryController.updateCategoriesColor);

// 이동 (일단 단일 이동부터 구현)
router.patch("/move", authenticate, validateMoveCategory, categoryController.moveCategory);

router.patch("/", authenticate, validateMoveCategory, categoryController.moveCategory);

// 삭제
router.delete("/", authenticate, validateDeleteCategories, categoryController.deleteCategories);

export default router;
