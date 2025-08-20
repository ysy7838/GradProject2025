import asyncHandler from "express-async-handler";
import {FILE_MESSAGES} from "../../../constants/message.js";

class FileController {
  constructor(fileService) {
    this.fileService = fileService;
    this.getPresignedUrl = asyncHandler(this.getPresignedUrl.bind(this));
  }

  async getPresignedUrl(req, res) {
    const {memoId, fileName, fileType} = req.body;
    const data = {memoId, fileName, fileType};
    const url = await this.fileService.getPresignedUrlForUpload(data);

    res.status(200).json({
      message: FILE_MESSAGES.PRESIGNED_URL_SUCCESS,
      presignedUrl: url.presignedUrl,
      finalUrl: url.finalUrl,
    });
  }
}

export default FileController;
