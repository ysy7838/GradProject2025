import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";

export default (fileController) => {
  const router = Router();

  // 파일 presigned-url 요청 (업로드용)
  router.post("/presigned-url/upload", authenticate, fileController.getPresignedUrl);

  // 이미지 조회용 presigned-url 요청
  router.get("/presigned-url/download", authenticate, fileController.getPresignedUrlForDownload);

  return router;
}