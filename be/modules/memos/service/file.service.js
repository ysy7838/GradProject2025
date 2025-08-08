import {S3Client, PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {FILE_MESSAGES} from "../../../constants/message.js";
import {ExternalServiceError} from "../../../utils/customError.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

class FileService {
  constructor() {
    this.s3Client = s3Client;
  }

  // getSignedUrl 헬퍼 함수
  async _createPresignedUrl(command, expiresIn = 60) {
    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, {expiresIn});
      return presignedUrl;
    } catch (error) {
      console.error("Presigned URL 생성 중 오류:", error);
      throw new ExternalServiceError(FILE_MESSAGES.PRESIGNED_URL_ERROR);
    }
  }


  // 파일 업로드 presigned URL 생성
  async getPresignedUrlForUpload(data) {
    const {memoId, fileName, fileType} = data;
    const bucketName = process.env.S3_BUCKET_NAME;
    const timestamp = Date.now();

    const key = `images/${timestamp}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await this._createPresignedUrl(command);
    const finalUrl = `${process.env.S3_BASE_URL}/${key}`;
    return {presignedUrl, finalUrl};
  }

  // 파일 다운로드(조회) presigned URL 생성
  async getPresignedUrlForDownload(data) {
    const {key} = data;
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const presignedUrl = await this._createPresignedUrl(command);
    return presignedUrl;
  }
}

export default new FileService();
