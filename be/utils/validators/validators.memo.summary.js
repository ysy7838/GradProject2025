import {check, body, param} from "express-validator";
import {validateMiddleware, validateObjectId} from "./validators.common.js";

/**
 * 텍스트 요약 검증
 * POST /api/memos/ai/text
 */
export const validateSummarizeText = [
  body("content")
    .notEmpty()
    .withMessage("요약할 텍스트 내용이 필요합니다.")
    .isString()
    .withMessage("텍스트 내용은 문자열이어야 합니다.")
    .isLength({ min: 10, max: 30000 })
    .withMessage("텍스트는 10자 이상 30,000자 이하여야 합니다."),
  
  body("options")
    .optional()
    .isObject()
    .withMessage("options는 객체 형태여야 합니다."),
  
  body("options.language")
    .optional()
    .isIn(["ko", "en"])
    .withMessage("언어는 ko 또는 en만 지원됩니다."),
  
  body("options.style")
    .optional()
    .isIn(["brief", "detailed"])
    .withMessage("스타일은 brief 또는 detailed만 지원됩니다."),
  
  body("options.focus")
    .optional()
    .isIn(["general", "key_points", "summary"])
    .withMessage("포커스는 general, key_points, summary 중 하나여야 합니다."),
  
  validateMiddleware
];

/**
 * 이미지 요약 검증 (JSON 형태)
 * POST /api/memos/ai/image
 */
export const validateSummarizeImage = [
  body("imageData")
    .notEmpty()
    .withMessage("이미지 데이터가 필요합니다.")
    .isObject()
    .withMessage("이미지 데이터는 객체 형태여야 합니다."),
  
  body("imageData.data")
    .notEmpty()
    .withMessage("base64 인코딩된 이미지 데이터가 필요합니다.")
    .isString()
    .withMessage("이미지 데이터는 문자열이어야 합니다."),
  
  body("imageData.mimeType")
    .notEmpty()
    .withMessage("이미지 MIME 타입이 필요합니다.")
    .isIn([
      "image/jpeg", "image/jpg", "image/png", 
      "image/gif", "image/webp", "image/bmp"
    ])
    .withMessage("지원하지 않는 이미지 형식입니다."),
  
  body("options")
    .optional()
    .isObject()
    .withMessage("options는 객체 형태여야 합니다."),
  
  body("options.language")
    .optional()
    .isIn(["ko", "en"])
    .withMessage("언어는 ko 또는 en만 지원됩니다."),
  
  body("options.style")
    .optional()
    .isIn(["descriptive", "analytical"])
    .withMessage("스타일은 descriptive 또는 analytical만 지원됩니다."),
  
  body("options.focus")
    .optional()
    .isIn(["content", "text", "objects"])
    .withMessage("포커스는 content, text, objects 중 하나여야 합니다."),
  
  validateMiddleware
];

/**
 * 메모 텍스트 요약 검증
 * POST /api/memos/:memoId/ai/text
 */
export const validateSummarizeMemoText = [
  param("memoId")
    .isMongoId()
    .withMessage("유효하지 않은 메모 ID입니다."),
  
  body("options")
    .optional()
    .isObject()
    .withMessage("options는 객체 형태여야 합니다."),
  
  body("options.language")
    .optional()
    .isIn(["ko", "en"])
    .withMessage("언어는 ko 또는 en만 지원됩니다."),
  
  body("options.style")
    .optional()
    .isIn(["brief", "detailed"])
    .withMessage("스타일은 brief 또는 detailed만 지원됩니다."),
  
  body("options.focus")
    .optional()
    .isIn(["general", "key_points", "summary"])
    .withMessage("포커스는 general, key_points, summary 중 하나여야 합니다."),
  
  validateMiddleware
];