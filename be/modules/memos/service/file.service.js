import {PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, CopyObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {FILE_MESSAGES} from "../../../constants/message.js";
import {ExternalServiceError} from "../../../utils/customError.js";

class FileService {
  constructor(s3Client) {
    this.s3Client = s3Client;
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  // 이미지 조회 presigned URL 생성
  async getPresignedUrl(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, {expiresIn: 3600}); // 1시간 유효
    } catch (error) {
      console.error(`Presigned URL 생성 중 오류 (Key: ${key}):`, error);
      throw new ExternalServiceError(FILE_MESSAGES.PRESIGNED_URL_ERROR);
    }
  }

  // 파일 업로드 presigned URL 생성
  async getPresignedUrlForUpload(data) {
    const {userId, fileName, fileType} = data;
    try {
      const timestamp = Date.now();

      const key = `images/${userId}/${timestamp}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {expiresIn: 600});
      return {presignedUrl, key};
    } catch (error) {
      console.error("Upload Presigned URL 생성 중 오류:", error);
      throw new ExternalServiceError(FILE_MESSAGES.PRESIGNED_URL_ERROR);
    }
  }

  // 이미지를 S3에 직접 업로드
  async uploadImageToS3(data) {
    const {buffer, key, contentType} = data;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });
      await this.s3Client.send(command);
      return {key}; // 👇 Presigned URL 대신 Key를 반환하여 역할을 명확히 함
    } catch (error) {
      console.error(`S3 이미지 업로드 중 오류 (Key: ${key}):`, error);
      throw new ExternalServiceError(FILE_MESSAGES.FILE_UPLOAD_ERROR);
    }
  }

  /**
   * @param {string} sourceKey - 복사할 원본 객체 키
   * @param {string} destinationKey - 복사될 대상 객체 키
   */
  async copyImageInS3(sourceKey, destinationKey) {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`S3 이미지 복사 중 오류 (Source: ${sourceKey}):`, error);
      throw new ExternalServiceError(FILE_MESSAGES.FILE_COPY_ERROR); // 👈 에러 메시지 추가 필요
    }
  }

  /**
   * @param {string[]} keys - 삭제할 객체 키들의 배열
   */
  async deleteImagesFromS3(keys) {
    if (!keys || keys.length === 0) return;

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({Key: key})),
        },
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error(`S3 이미지 삭제 중 오류 (Keys: ${keys.join(", ")}):`, error);
      throw new ExternalServiceError(FILE_MESSAGES.FILE_DELETE_ERROR); // 👈 에러 메시지 추가 필요
    }
  }
}

export default FileService;
