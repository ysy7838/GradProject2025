import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";
import fileController from "../controller/file.controller.js";

const router = Router();

// 파일 presigned-url 요청
router.post("/presigned-url", authenticate, fileController.getPresignedUrl);

export default router;
