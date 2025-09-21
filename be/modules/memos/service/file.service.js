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

  /**
   * 이미지를 직접 S3에 업로드
   * @param {Object} data - buffer, key, contentType, userId
   * @returns {Promise<string>} S3 URL
   */
  async uploadImageToS3(data) {
    const {buffer, key, contentType, userId} = data;
    const bucketName = process.env.S3_BUCKET_NAME;
    
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          userId: userId.toString(),
          uploadDate: new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      
      // 환경변수의 S3_BASE_URL 사용
      const baseUrl = process.env.S3_BASE_URL || `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com`;
      return `${baseUrl}/${key}`;
      
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new ExternalServiceError("이미지 업로드 중 오류가 발생했습니다.");
    }
  }

  /**
   * S3에서 이미지 삭제
   */
  async deleteImageFromS3(key) {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
      
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new ExternalServiceError("이미지 삭제 중 오류가 발생했습니다.");
    }
  }
}

export default FileService;
