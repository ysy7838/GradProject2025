// src/store/auth.ts
import { atom } from "recoil";
import type { User } from "@/types/auth";

export const userState = atom<User | null>({
  key: "userState",
  default: null,
});

// 로컬 스토리지 관련 유틸리티 함수
export const authUtils = {
  // 액세스 토큰 관련
  getToken: () => {
    const token = localStorage.getItem("accessToken");
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 토큰 읽기:",
        token ? `${token.substring(0, 15)}...` : "없음"
      );
    }
    return token;
  },
  setToken: (token: string) => {
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 토큰 저장:",
        token ? `${token.substring(0, 15)}...` : "없음"
      );
    }
    localStorage.setItem("accessToken", token);
    // 저장 확인
    const savedToken = localStorage.getItem("accessToken");
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 토큰 저장 확인:",
        savedToken ? "성공" : "실패"
      );
    }
  },
  removeToken: () => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 토큰 삭제");
    }
    localStorage.removeItem("accessToken");
  },

  // 리프레시 토큰 관련
  getRefreshToken: () => {
    const token = localStorage.getItem("refreshToken");
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 리프레시 토큰 읽기:",
        token ? `${token.substring(0, 15)}...` : "없음"
      );
    }
    return token;
  },
  setRefreshToken: (token: string) => {
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 리프레시 토큰 저장:",
        token ? `${token.substring(0, 15)}...` : "없음"
      );
    }
    localStorage.setItem("refreshToken", token);
  },
  removeRefreshToken: () => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 리프레시 토큰 삭제");
    }
    localStorage.removeItem("refreshToken");
  },

  // 유저 정보 관련
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 유저 정보 읽기:", userStr ? "있음" : "없음");
    }
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("저장된 유저 정보 파싱 오류:", error);
      return null;
    }
  },
  setStoredUser: (user: User) => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 유저 정보 저장:", user);
    }
    localStorage.setItem("user", JSON.stringify(user));
    // 저장 확인
    const savedUser = localStorage.getItem("user");
    if (import.meta.env.DEV) {
      console.log(
        "🔑 [AuthUtils] 유저 정보 저장 확인:",
        savedUser ? "성공" : "실패"
      );
    }
  },
  removeStoredUser: () => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 유저 정보 삭제");
    }
    localStorage.removeItem("user");
  },

  // 로그인 상태 유지 관련
  setRememberMe: (remember: boolean) => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 자동 로그인 설정:", remember);
    }
    localStorage.setItem("remember-me", String(remember));
  },
  getRememberMe: () => {
    const rememberMe = localStorage.getItem("remember-me") === "true";
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 자동 로그인 읽기:", rememberMe);
    }
    return rememberMe;
  },
  removeRememberMe: () => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 자동 로그인 삭제");
    }
    localStorage.removeItem("remember-me");
  },

  // 초기화
  clearAll: () => {
    if (import.meta.env.DEV) {
      console.log("🔑 [AuthUtils] 모든 인증 정보 초기화");
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("remember-me");
  },
};
