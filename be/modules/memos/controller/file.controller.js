import asyncHandler from "express-async-handler";
import {FILE_MESSAGES} from "../../../constants/message.js";

class FileController {
  constructor(fileService) {
    this.fileService = fileService;
    this.getPresignedUrl = asyncHandler(this.getPresignedUrl.bind(this));
    this.getImageUrl = asyncHandler(this.getImageUrl.bind(this));
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

  async getImageUrl(req, res) {
    const { key } = req.params;
    const presignedUrl = await this.fileService.getPresignedUrlForDownload({ key });

    res.status(200).json({
      message: FILE_MESSAGES.FILE_DOWNLOAD_SUCCESS,
      presignedUrl,
    });
  }
}

export default FileController;
