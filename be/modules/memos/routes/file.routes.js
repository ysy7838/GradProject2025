import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";

export default (fileController) => {
  const router = Router();

  // 파일 presigned-url 요청
  router.post("/presigned-url", authenticate, fileController.getPresignedUrl);

  return router;
}