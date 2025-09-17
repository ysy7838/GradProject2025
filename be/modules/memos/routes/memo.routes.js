import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";
import multer from "multer";
import {
  validateGetMemoList,
  validateCreateMemo,
  validateUpdateMemoFav,
  validateMoveMemos,
  validateDeleteMemos,
  validateGetMemo,
  validateUpdateMemo,
  validateCopyMemo,
} from "../../../utils/validators/validators.memo.js";
import {
  validateSummarizeText,
  validateSummarizeImage,
  validateSummarizeMemoText,
} from "../../../utils/validators/validators.memo.summary.js";

// Multer 설정 (이미지 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

export default (memoController) => {
  const router = Router();

  // ===== 기존 메모 관리 API =====

  // 메모 생성
  router.post("/", authenticate, validateCreateMemo, memoController.createMemo);

  // 메모 목록 조회
  router.get("/", authenticate, validateGetMemoList, memoController.getMemoList);

  // 메모 즐겨찾기 추가/삭제
  router.patch("/fav", authenticate, validateUpdateMemoFav, memoController.updateMemoFav);

  // 메모 이동
  router.patch("/move", authenticate, validateMoveMemos, memoController.moveMemos);

  // 메모 삭제
  router.delete("/delete", authenticate, validateDeleteMemos, memoController.deleteMemos);

  // ===== Gemini AI 요약 API (간소화) =====

  // 텍스트 요약
  router.post("/ai/text", authenticate, validateSummarizeText, memoController.summarizeText);

  // 이미지 요약 (JSON 형태)
  router.post("/ai/image", authenticate, validateSummarizeImage, memoController.summarizeImage);

  // 이미지 요약 (파일 업로드)
  router.post("/ai/image/upload", authenticate, upload.single('image'), memoController.summarizeImageUpload);

  // 다중 이미지 요약
  router.post("/ai/images", authenticate, memoController.summarizeMultipleImages);

  // ===== 기타 기존 API =====

  // 메모 벡터 변환
  router.post("/vectorize", authenticate, memoController.convertToVec);

  // 메모 상세 조회
  router.get("/:memoId", authenticate, validateGetMemo, memoController.getMemoDetail);

  // 메모 1개 수정
  router.put("/:memoId", authenticate, validateUpdateMemo, memoController.updateMemo);

  // 메모 복사
  router.post("/:memoId/copy", authenticate, validateCopyMemo, memoController.copyMemo);

  // 해시태그 자동 생성
  router.patch("/:memoId/recommend-tags", authenticate, memoController.makeHashtags);

  // 특정 메모의 텍스트 요약
  router.post("/:memoId/ai/text", authenticate, validateSummarizeMemoText, memoController.summarizeMemoText);

  return router;
};