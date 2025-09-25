import asyncHandler from "express-async-handler";
import {FILE_MESSAGES} from "../../../constants/message.js";

class FileController {
  constructor(fileService) {
    this.fileService = fileService;
    this.getPresignedUrl = asyncHandler(this.getPresignedUrl.bind(this));
    this.getPresignedUrlForDownload = asyncHandler(this.getPresignedUrlForDownload.bind(this));
  }

  // POST /api/files/presigned-url/upload
  async getPresignedUrl(req, res) {
    const {memoId, fileName, fileType} = req.body;
    const createdBy = req.user.id;
    
    const data = {
      memoId, 
      fileName, 
      fileType,
      userId: createdBy
    };
    
    const result = await this.fileService.getPresignedUrlForUpload(data);

    res.status(200).json({
      message: FILE_MESSAGES.PRESIGNED_URL_SUCCESS,
      presignedUrl: result.presignedUrl,
      finalUrl: result.finalUrl,
      key: result.key
    });
  }

  // GET /api/files/presigned-url/download
  async getPresignedUrlForDownload(req, res) {
    const { key } = req.query;
    
    if (!key) {
      return res.status(400).json({
        error: "S3 key가 필요합니다."
      });
    }

    const presignedUrl = await this.fileService.getPresignedUrlForDownload({ key });

    res.status(200).json({
      message: FILE_MESSAGES.FILE_DOWNLOAD_SUCCESS,
      presignedUrl
    });
  }
}

export default FileController;
