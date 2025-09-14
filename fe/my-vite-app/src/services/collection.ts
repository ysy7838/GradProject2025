// src/services/collection.ts
import api from "@/utils/api";
import { handleApiError } from "@/utils/errorHandler";
import type { GetCollectionParams, SharedUsers } from "@/types/collection";
import { CollectionResponse } from "@/types/collection";
import { authUtils } from "@/store/auth";

class CollectionService {
  // 목록 조회
  async getCollectionList(
    params?: GetCollectionParams
  ): Promise<CollectionResponse> {
    try {
      const response = await api.get(
        "/api/collections",
        params ? { params } : undefined
      );
      return response.data ?? { data: [] };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 컬렉션 생성
  async createCollection(title: string): Promise<CollectionResponse> {
    try {
      const response = await api.post("/api/collections", { title });

      // GA4 이벤트 전송
      (window as any).gtag("event", "create_collection", {
        title: title,
      });

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 컬렉션 수정
  async updateCollection(
    id: string,
    title: string
  ): Promise<CollectionResponse> {
    try {
      const response = await api.patch(`/api/collections/${id}`, { title });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 컬렉션 삭제
  async deleteCollection(ids: string[]): Promise<void> {
    try {
      await api.delete(`/api/collections`, {
        data: { collectionIds: ids },
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 컬렉션 즐겨찾기
  async likeCollection(id: string): Promise<void> {
    try {
      await api.patch(`/api/collections/${id}/favorite`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 공유 사용자 조회
  async getSharedUsers(collectionId: string): Promise<SharedUsers> {
    try {
      const response = await api.get(
        `/api/collections/${collectionId}/sharing/shared-users`,
        {}
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 공유 사용자 추가 및 수정
  async updateSharedUsers(
    collectionId: string,
    email: string,
    role?: string
  ): Promise<void> {
    try {
      const response = await api.patch(
        `/api/collections/${collectionId}/sharing/shared-users`,
        {
          email,
          role,
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 공유 사용자 삭제
  async deleteSharedUsers(collectionId: string, userId: string): Promise<void> {
    try {
      await api.delete(
        `/api/collections/${collectionId}/sharing/shared-users/${userId}`,
        {}
      );
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 컬렉션 나만 보기
  async setPrivate(collectionId: string): Promise<void> {
    try {
      const response = await api.patch(
        `/api/collections/${collectionId}/sharing/set-private`,
        {}
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

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

  // 미리보기 이미지 조회
  // src/services/collection.ts - getImage function

  async getImage(url: string): Promise<string> {
    if (!url) return "";

    try {
      // S3 URL 처리 (서버에서 이미 인코딩됨)
      if (
        url.includes("s3.ap-northeast-2.amazonaws.com") ||
        url.includes("refhub-bucket")
      ) {
        // API를 통해 프록시 요청 (인증 포함)
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
      console.error("이미지 로딩 오류:", error);
      // 무한 루프 방지
      if (url.includes("placeholder")) {
        return ""; // 빈 문자열 반환
      }
      return "/images/placeholder.svg"; // .svg로 변경
    }
  }
}

export const collectionService = new CollectionService();
