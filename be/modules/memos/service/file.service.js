import {PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {FILE_MESSAGES} from "../../../constants/message.js";
import {ExternalServiceError} from "../../../utils/customError.js";

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

class FileService {
  constructor(s3Client) {
    this.s3Client = s3Client;
  }

  // getSignedUrl 헬퍼 함수
  async _createPresignedUrl(command, expiresIn = 3600) { // 기본 1시간으로 변경
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
    const {memoId, fileName, fileType, userId} = data;
    const bucketName = process.env.S3_BUCKET_NAME;
    const timestamp = Date.now();

    // userId를 포함한 key 생성
    const key = userId 
      ? `images/${userId}/${timestamp}-${fileName}`
      : `images/${timestamp}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await this._createPresignedUrl(command, 3600); // 1시간
    const finalUrl = `${process.env.S3_BASE_URL}/${key}`;
    
    return {
      presignedUrl, 
      finalUrl,
      key  // key 반환
    };
  }

  // 파일 다운로드(조회) presigned URL 생성
  async getPresignedUrlForDownload(data) {
    const {key} = data;
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // 1시간 유효한 URL 생성 (필요에 따라 조정)
    const presignedUrl = await this._createPresignedUrl(command, 3600);
    return presignedUrl;
  }

  // 업로드 직후 확인용 Pre-signed URL 생성
  async getPresignedUrlForDisplay(key, expiresIn = 3600) {
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await this._createPresignedUrl(command, expiresIn);
  }
  
  // 이미지를 S3에 직접 업로드
  async uploadImageToS3(data) {
    const { buffer, key, contentType } = data;
    const bucketName = process.env.S3_BUCKET_NAME;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });

      await this.s3Client.send(command);
      const cleanKey = key.replace(/^\/+/, '');
      return process.env.S3_BASE_URL.replace(/\/+$/, '') + '/' + cleanKey;
    } catch (error) {
      console.error("S3 이미지 업로드 중 오류:", error);
      throw new ExternalServiceError(FILE_MESSAGES.FILE_UPLOAD_ERROR);
    }
  }
}

export default FileService;
