// src/services/reference.ts
import api from "@/utils/api";
import { authUtils } from "@/store/auth";
import { handleApiError } from "@/utils/errorHandler";
import type {
  GetReferenceParams,
  Reference,
  CreateReferenceFile,
  CreateReferenceResponse,
  UpdateReferenceRequest,
  ReferenceResponse,
  ReferenceDetailResponse,
  ReferenceListResponse,
} from "@/types/reference";

class ReferenceService {
  private baseUrl = "https://api.refhub.site";

  private async fetchWithAuth(url: string): Promise<string> {
    try {
      // S3 URL인 경우, API 서버를 통해 이미지를 프록싱
      if (
        url.includes("s3.ap-northeast-2.amazonaws.com") ||
        url.includes("refhub-bucket")
      ) {
        // API 서버의 프록시 엔드포인트 사용
        const token = authUtils.getToken();
        const proxyUrl = `${
          this.baseUrl
        }/api/references/download?fileUrl=${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`이미지 로드 실패: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      // S3가 아닌 다른 URL은 기존 방식대로 처리
      const token = authUtils.getToken();
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`이미지 로드 실패: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching image:", error);
      // 오류 발생 시 대체 이미지 반환 또는 원본 URL 유지
      return "/images/placeholder.svg"; // 로컬 플레이스홀더 이미지 사용
    }
  }

  async transformUrl(url?: string): Promise<string> {
    if (!url) return "";

    try {
      // 전체 함수를 try-catch로 감싸서 오류 처리 개선
      // blob URL인 경우, 올바른 도메인을 사용하도록 함
      if (url.startsWith("blob:")) {
        // blob ID를 추출하고 현재 도메인으로 새 blob URL 생성
        const blobId = url.split("/").pop();
        return `blob:${window.location.origin}/${blobId}`;
      }

      // 로컬 개발 환경에서 S3 URL 처리
      if (
        window.location.hostname === "localhost" &&
        (url.includes("s3.ap-northeast-2.amazonaws.com") ||
          url.includes("refhub-bucket"))
      ) {
        try {
          return await this.fetchWithAuth(url);
        } catch (error) {
          console.error("S3 이미지 로드 실패:", error);
          return "/images/placeholder.svg"; // .svg로 변경
        }
      }

      // S3 URL 처리
      if (
        url.includes("s3.ap-northeast-2.amazonaws.com") ||
        url.includes("refhub-bucket")
      ) {
        return await this.fetchWithAuth(url);
      }

      // 상대 경로 처리
      if (!url.includes("://")) {
        const fullUrl = `${this.baseUrl}${url}`;
        if (url.includes("/api/references/file/")) {
          return await this.fetchWithAuth(fullUrl);
        }
        return fullUrl;
      }

      // API 도메인 URL 처리
      if (url.includes("api.refhub.site")) {
        if (url.includes("/api/references/file/")) {
          return await this.fetchWithAuth(url);
        }
        return url;
      }

      // 도메인 변환 처리
      if (url.includes("refhub.my")) {
        const newUrl = url.replace("refhub.my", "api.refhub.site");
        if (newUrl.includes("/api/references/file/")) {
          return await this.fetchWithAuth(newUrl);
        }
        return newUrl;
      }

      // 기타 URL은 그대로 반환
      return url;
    } catch (error) {
      console.error("URL 변환 오류:", error);
      // 무한 루프 방지: placeholder를 이미 요청 중인지 확인
      if (url?.includes("placeholder")) {
        // 무한 루프 방지를 위해 빈 문자열 반환
        return "";
      }
      return "/images/placeholder.svg"; // .svg로 변경
    }
  }

  // 레퍼런스 목록 조회
  async getReferenceList(
    params: GetReferenceParams
  ): Promise<ReferenceListResponse> {
    try {
      console.log("Getting reference list with params:", params);
      const response = await api.get<ReferenceListResponse>("/api/references", {
        params,
      });
      console.log("Reference list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get reference list:", error);
      throw handleApiError(error);
    }
  }

  // 단일 레퍼런스 조회
  async getReference(id: string): Promise<Reference> {
    try {
      console.log("Getting reference details for ID:", id);
      const response = await api.get<ReferenceDetailResponse>(
        `/api/references/${id}`
      );
      const { referenceDetail } = response.data;
      console.log("Reference details response:", referenceDetail);

      return {
        _id: id,
        collectionId: referenceDetail.collectionId,
        collectionTitle: referenceDetail.collectionTitle,
        createdAt: referenceDetail.createdAt,
        updatedAt: referenceDetail.updatedAt, // 이 필드 추가
        title: referenceDetail.referenceTitle,
        keywords: referenceDetail.keywords || [],
        memo: referenceDetail.memo || "",
        files: await Promise.all(
          referenceDetail.attachments.map(async (attachment) => ({
            _id: attachment.path,
            type: attachment.type,
            path: attachment.path,
            size: attachment.size,
            images: attachment.images,
            filename: attachment.filename
              ? decodeURIComponent(attachment.filename)
              : undefined,
            filenames: attachment.filenames
              ? attachment.filenames.map((name) => decodeURIComponent(name))
              : undefined,
            previewURL: attachment.previewURL
              ? await this.transformUrl(attachment.previewURL)
              : undefined,
            previewURLs: attachment.previewURLs
              ? await Promise.all(
                  attachment.previewURLs.map((url) => this.transformUrl(url))
                )
              : undefined,
          }))
        ),
      };
    } catch (error) {
      console.error("Failed to get reference details:", error);
      throw handleApiError(error);
    }
  }

  // 레퍼런스 이동
  async moveReference(ids: string[], title: string): Promise<void> {
    try {
      console.log("Moving references:", { ids, newCollection: title });
      const response = await api.patch(`/api/references`, {
        referenceIds: ids,
        newCollection: title,
      });
      console.log("Move reference response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to move references:", error);
      throw handleApiError(error);
    }
  }

  // 레퍼런스 생성
  async createReference({
    collectionId,
    title,
    keywords,
    memo,
    files,
  }: UpdateReferenceRequest): Promise<CreateReferenceResponse> {
    try {
      console.log("Creating reference:", {
        collectionId,
        title,
        keywords,
        memo,
      });
      console.log(
        "Files FormData entries:",
        [...files.entries()].map(([key, value]) =>
          typeof value === "string"
            ? { key, value }
            : { key, type: "File/Blob" }
        )
      );

      const formData = new FormData();
      formData.append("collectionId", collectionId);
      formData.append("title", title);

      if (keywords?.length) {
        formData.append("keywords", keywords.join(" "));
      }

      if (memo) {
        formData.append("memo", memo);
      }

      // Append files from the provided FormData
      for (const [key, value] of files.entries()) {
        formData.append(key, value);
      }

      const response = await api.post<CreateReferenceResponse>(
        "/api/references/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Create reference response:", response.data);

      // GA4 이벤트 전송
      (window as any).gtag("event", "create_reference", {
        title: title,
      });

      return response.data;
    } catch (error) {
      console.error("Failed to create reference:", error);
      throw handleApiError(error);
    }
  }

  // 레퍼런스 수정
  async updateReference(
    id: string,
    { collectionId, title, keywords, memo, files }: UpdateReferenceRequest
  ): Promise<ReferenceResponse> {
    try {
      console.log("Updating reference:", {
        id,
        collectionId,
        title,
        keywords,
        memo,
      });

      const formData = new FormData();
      formData.append("collectionId", collectionId);
      formData.append("title", title);

      if (keywords?.length) {
        formData.append("keywords", keywords.join(" "));
      }

      if (memo) {
        formData.append("memo", memo);
      }

      // Append files from the provided FormData
      for (const [key, value] of files.entries()) {
        formData.append(key, value);
      }

      // FormData 내용 디버깅 (파일은 [File Object]로 표시)
      console.log("Update FormData keys:", [...formData.keys()]);
      const formDataDebug = Object.fromEntries(
        [...formData.entries()].map(([key, value]) => [
          key,
          typeof value === "object" &&
          value !== null &&
          ((typeof File !== "undefined" && value instanceof File) ||
            (typeof Blob !== "undefined" && "size" in value && "type" in value))
            ? `[${
                typeof File !== "undefined" && value instanceof File
                  ? "File"
                  : "Blob"
              } Object]`
            : value,
        ])
      );
      console.log("Update FormData content:", formDataDebug);

      const response = await api.patch<ReferenceResponse>(
        `/api/references/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Update reference response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to update reference:", error);
      throw handleApiError(error);
    }
  }

  // 레퍼런스 삭제
  async deleteReference(id: string): Promise<void> {
    try {
      console.log("Deleting reference:", id);
      await api.delete(`/api/references/${id}`);
      console.log("Reference deleted successfully");
    } catch (error) {
      console.error("Failed to delete reference:", error);
      throw handleApiError(error);
    }
  }

  // 레퍼런스 여러개 삭제
  async deleteReferences(ids: string[]): Promise<void> {
    try {
      console.log("Deleting multiple references:", ids);
      await api.delete("/api/references", {
        data: { referenceIds: ids },
      });
      console.log("Multiple references deleted successfully");
    } catch (error) {
      console.error("Failed to delete multiple references:", error);
      throw handleApiError(error);
    }
  }

  // 파일 데이터 준비 - 수정된 함수
  prepareFilesFormData(files: CreateReferenceFile[]): FormData {
    console.log("파일 FormData 준비 시작:", files);
    const formData = new FormData();
    let imageCount = 1;

    // 기존 파일 경로 추적용 배열
    const existingFilePaths: string[] = [];
    // 새로 추가된 링크만 저장할 배열
    const newLinks: string[] = [];

    const normalizeAndEncodeFileName = (name: string): string => {
      const normalized = name.normalize("NFC"); // 한글 정규화 (중요!)
      const dotIndex = normalized.lastIndexOf(".");
      if (dotIndex === -1) return encodeURIComponent(normalized); // 확장자 없음

      const nameWithoutExt = normalized.substring(0, dotIndex);
      const ext = normalized.substring(dotIndex + 1);
      return `${encodeURIComponent(nameWithoutExt)}.${ext}`;
    };

    // 파일별 처리 - 로깅 강화
    files.forEach((file, index) => {
      console.log(`파일 ${index} 처리:`, {
        id: file.id,
        type: file.type,
        originalPath: file.originalPath,
        contentLength: file.content ? file.content.length : 0,
      });

      // 파일 타입별 처리
      if (file.type === "link") {
        // 링크 처리 수정: 기존 링크는 existingFiles에만 추가, 새 링크만 links에 추가
        if (file.originalPath) {
          // 기존 링크는 existingFiles 배열에만 추가
          existingFilePaths.push(file.originalPath);
          console.log(
            `기존 링크 유지 (links에 추가하지 않음):`,
            file.originalPath
          );
        } else {
          // 새 링크만 links 매개변수로 추가
          newLinks.push(file.content);
          console.log(`새 링크 추가:`, file.content);
        }
      } else if (file.type === "image") {
        try {
          // 이미지 파일이고 originalPath가 있는 경우, 무조건 기존 파일 경로에 추가
          if (file.originalPath) {
            existingFilePaths.push(file.originalPath);
            console.log("기존 이미지 경로 유지:", file.originalPath);
          }

          // 이후 내용 파싱은 새로운 이미지가 있는지 확인하는 용도로만 사용
          if (file.content) {
            try {
              const images = JSON.parse(file.content);
              if (Array.isArray(images)) {
                // blob: URL도 유효한 기존 이미지로 인식하도록 조건 수정
                const existingImages = images.filter(
                  (img) =>
                    img.url &&
                    (img.url.startsWith("http://") ||
                      img.url.startsWith("https://") ||
                      img.url.startsWith("blob:"))
                );
                // 새 이미지만 필터링 (data: 시작하는 것만)
                const newImages = images.filter(
                  (img) => img.url && img.url.startsWith("data:")
                );

                console.log("이미지 처리:", {
                  유지중인원본경로: !!file.originalPath,
                  기존이미지수: existingImages.length,
                  새이미지수: newImages.length,
                });

                // 새 이미지 처리
                if (newImages.length > 0) {
                  const imageFiles: File[] = [];

                  for (const image of newImages) {
                    try {
                      const blobData = this.base64ToBlob(image.url);
                      const originalName =
                        image.name || `image${imageCount}.png`;
                      const encodedFileName =
                        normalizeAndEncodeFileName(originalName);

                      // Blob에서 File 객체 생성
                      const imageFile = new File([blobData], encodedFileName, {
                        type: blobData.type,
                      });

                      imageFiles.push(imageFile);
                      console.log("새 이미지 파일 생성:", encodedFileName);
                    } catch (error) {
                      console.error("이미지 처리 오류:", error);
                    }
                  }

                  // 이미지 파일들을 FormData에 추가
                  if (imageFiles.length > 0) {
                    for (const imgFile of imageFiles) {
                      formData.append(`images${imageCount}`, imgFile);
                      console.log(
                        `새 이미지를 FormData에 추가 (images${imageCount}):`,
                        imgFile.name
                      );
                    }
                    imageCount++;
                  }
                }
              }
            } catch (error) {
              console.error(
                "이미지 데이터 파싱 실패, 원본 경로는 유지됩니다:",
                error,
                file.content ? file.content.substring(0, 100) : "빈 내용"
              );
              // 파싱에 실패하더라도 원본 경로는 유지
            }
          }
        } catch (error) {
          console.error("이미지 처리 중 오류:", error);
          // 오류가 발생해도 원본 경로가 있으면 유지
          if (file.originalPath) {
            existingFilePaths.push(file.originalPath);
            console.log(
              "오류 발생했지만 기존 이미지 경로 유지:",
              file.originalPath
            );
          }
        }
      } else if (file.type === "pdf") {
        if (file.content.startsWith("data:")) {
          // 새 PDF 파일
          const blobData = this.base64ToBlob(file.content);
          const fileName = file.name || "document.pdf";
          const encodedFileName = normalizeAndEncodeFileName(fileName);
          formData.append("files", blobData, encodedFileName);
          console.log("새 PDF 파일 추가:", encodedFileName);
        } else if (
          file.content.startsWith("http://") ||
          file.content.startsWith("https://") ||
          file.content.startsWith("blob:")
        ) {
          // 기존 PDF 파일 - 원본 경로 사용
          const pathToUse = file.originalPath || file.content;
          if (pathToUse) {
            existingFilePaths.push(pathToUse);
            console.log("기존 PDF 경로 유지:", pathToUse);
          }
        }
      } else if (file.type === "file") {
        if (file.content.startsWith("data:")) {
          // 새 일반 파일
          const blobData = this.base64ToBlob(file.content);
          const fileName = file.name || "file";
          const encodedFileName = normalizeAndEncodeFileName(fileName);
          formData.append("otherFiles", blobData, encodedFileName);
          console.log("새 파일 추가:", encodedFileName);
        } else if (
          file.content.startsWith("http://") ||
          file.content.startsWith("https://") ||
          file.content.startsWith("blob:")
        ) {
          // 기존 일반 파일 - 원본 경로 사용
          const pathToUse = file.originalPath || file.content;
          if (pathToUse) {
            existingFilePaths.push(pathToUse);
            console.log("기존 파일 경로 유지:", pathToUse);
          }
        }
      }
    });

    // 새 링크만 links 매개변수로 추가
    newLinks.forEach((link) => {
      formData.append("links", link);
      console.log("새 링크를 FormData에 추가:", link);
    });

    // 기존 파일 정보를 FormData에 추가
    if (existingFilePaths.length > 0) {
      console.log(
        "유지할 기존 파일 목록 (JSON.stringify 전):",
        existingFilePaths
      );
      formData.append("existingFiles", JSON.stringify(existingFilePaths));
      console.log(
        "FormData에 기존 파일 목록 추가:",
        JSON.stringify(existingFilePaths)
      );
    } else {
      console.log("유지할 기존 파일이 없습니다!");
      // 빈 배열 전달하여 모든 기존 파일 삭제 명시
      formData.append("existingFiles", JSON.stringify([]));
    }

    // FormData에 들어간 모든 키 출력
    console.log("최종 FormData 키 목록:", [...formData.keys()]);

    return formData;
  }

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1] || "";
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }
}

export const referenceService = new ReferenceService();
