// src/services/user.ts
import api from "@/utils/api";
import { handleApiError } from "@/utils/errorHandler";

class UserService {
  // 프로필 정보 가져오기
  async getMyProfile() {
    try {
      const response = await api.get("/api/users/my-page");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 프로필 이미지 업로드
  async uploadProfileImage(file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.patch("/api/users/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 프로필 이미지 삭제
  async deleteProfileImage() {
    try {
      const response = await api.delete("/api/users/profile-image");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 사용자 이름 변경
  async updateUsername(newName: string) {
    try {
      const response = await api.patch("/api/users/user-name", { newName });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const userService = new UserService();
