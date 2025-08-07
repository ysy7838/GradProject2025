import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";
import memoController from "../controller/memo.controller.js";
import fileController from "../controller/file.controller.js";
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

const router = Router();

// 메모 생성
router.post("/", authenticate, validateCreateMemo, memoController.createMemo);

// 메모 목록 조회
router.get("/", authenticate, validateGetMemoList, memoController.getMemoList);

// 메모 즐겨찾기 추가/삭제
router.patch("/fav", authenticate, validateUpdateMemoFav, memoController.updateMemoFav);


// 메모 이동
router.patch("/move", authenticate, validateMoveMemos, memoController.moveMemos);

// 메모 삭제
router.patch("/delete", authenticate, validateDeleteMemos, memoController.deleteMemos);

// 메모 벡터 변환
router.post("/vectorize", authenticate, memoController.convertToVec);

// 요약
router.post("/ai/text", authenticate, memoController.summarizeText);
router.post("/ai/image", authenticate, memoController.summarizeImage);


// 메모 상세 조회
router.get("/:memoId", authenticate, validateGetMemo, memoController.getMemoDetail);

// 메모 1개 수정
router.patch("/:memoId", authenticate, validateUpdateMemo, memoController.updateMemo);

// 메모 복사
router.post("/:memoId/copy", authenticate, validateCopyMemo, memoController.copyMemo);

// 해시태그 자동 생성
router.patch("/:memoId/recommend-tags", authenticate, memoController.makeHashtags);

// 파일 presigned-url 요청
router.post("/file/presigned-url", authenticate, fileController.getPresignedUrl);

export default router;
