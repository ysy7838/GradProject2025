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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB로 증가
  },
  fileFilter: (req, file, cb) => {
    // 지원하는 이미지 형식
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다.'), false);
    }
  }
});

export default (memoController) => {
  const router = Router();

  // 이미지 업로드 + 요약 (S3 저장 포함)
  router.post(
    "/ai/image/upload", 
    authenticate, 
    upload.single('image'), 
    memoController.summarizeImageUpload
  );

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

  // 이미지 요약 (파일 업로드)
  router.post("/ai/image/upload", authenticate, upload.single('image'), memoController.summarizeImageUpload);

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