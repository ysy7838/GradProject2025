// src/services/auth.ts
import type {
  LoginForm,
  SignupForm,
  PasswordResetForm,
  AuthResponse,
  VerifyCodeForm,
  KakaoLinkResponse,
} from "@/types/auth";
import api from "@/utils/api";
import axios, { AxiosError } from "axios";
import { ERROR_MESSAGES, handleApiError } from "@/utils/errorHandler";
import { authUtils } from "@/store/auth";

class AuthService {
  // 인증번호 전송 (회원가입)
  async sendVerificationCode(name: string, email: string): Promise<void> {
    try {
      const response = await api.post("/api/users/email", { name, email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data;
        // 카카오 로그인으로 가입된 이메일인 경우 처리
        if (errorMsg === "카카오 로그인으로 가입된 이메일입니다.") {
          throw new Error(
            "카카오 로그인으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요."
          );
        }
        // 이미 존재하는 계정일 경우 에러 메시지 던지기
        throw new Error("이미 가입된 이메일입니다.");
      }
      throw handleApiError(error);
    }
  }

  // 인증번호 검증 (회원가입)
  async verifyCode(data: VerifyCodeForm): Promise<void> {
    try {
      const response = await api.post("/api/users/verify-code", {
        email: data.email,
        verificationCode: data.verificationCode,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 회원가입
  async signup(data: SignupForm): Promise<void> {
    try {
      const response = await api.post("/api/users/signup", {
        verifiedEmail: data.email,
        password: data.password,
        confirmPassword: data.passwordConfirm,
      });

      // GA4 이벤트 전송
      if (typeof window.gtag === "function") {
        window.gtag("event", "sign_up_complete", {
          method: "email",
        });
      }

      return response.data;
    } catch (error) {
      // 카카오 로그인 계정 처리
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data;
        if (errorMsg === "카카오 로그인으로 가입된 이메일입니다.") {
          throw new Error(
            "카카오 로그인으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요."
          );
        }
      }
      throw handleApiError(error);
    }
  }

  // 로그인
  async login(data: LoginForm, autoLogin: boolean): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/api/users/login", {
        email: data.email,
        password: data.password,
        autoLogin,
      });

      const { accessToken, refreshToken } = response.data;

      if (accessToken) {
        authUtils.setToken(accessToken);

        window.postMessage(
          {
            type: "REFHUB_TOKEN",
            token: accessToken,
          },
          "*"
        );

        if (refreshToken) {
          authUtils.setRefreshToken(refreshToken);
        }

        if (autoLogin) {
          authUtils.setRememberMe(true);
        }

        // GA4 이벤트 전송
        if (typeof window.gtag === "function") {
          window.gtag("event", "login_success", {
            method: "email",
          });
        }
      } else {
        throw new Error("로그인 응답에 토큰이 없습니다.");
      }

      return response.data;
    } catch (err) {
      const error = err as Error | AxiosError;

      if (axios.isAxiosError(error) && error.response) {
        // 카카오 로그인 계정 처리
        if (
          error.response.status === 400 &&
          error.response.data === "카카오 로그인 전용 계정입니다."
        ) {
          throw new Error(
            "카카오 로그인으로 가입된 계정입니다. 카카오 로그인을 이용해주세요."
          );
        }

        // HTTP 상태 코드에 따른 처리
        if (error.response.status === 404) {
          // 등록되지 않은 계정(404)은 항상 동일한 메시지로 처리
          throw new Error(ERROR_MESSAGES.ACCOUNT.NOT_FOUND);
        } else if (error.response.status === 400) {
          // 400 오류(비밀번호 불일치, 형식 오류 등)는 일관된 메시지로 처리
          throw new Error(ERROR_MESSAGES.ACCOUNT.INVALID_CREDENTIALS);
        } else if (error.response.status === 401) {
          throw new Error(ERROR_MESSAGES.ACCOUNT.INVALID_CREDENTIALS);
        }
      }

      throw handleApiError(error);
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    try {
      const response = await api.post("/api/users/logout");
      authUtils.clearAll();
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 비밀번호 재설정 인증번호 전송
  async sendPasswordResetCode(email: string): Promise<void> {
    try {
      const response = await api.post("/api/users/password/email", { email });
      return response.data;
    } catch (error) {
      // 카카오 로그인 계정 처리
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data;
        if (errorMsg === "카카오 로그인으로 가입된 이메일입니다.") {
          throw new Error(
            "카카오 로그인으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요."
          );
        }
      }
      throw handleApiError(error);
    }
  }

  // 비밀번호 재설정 인증번호 검증
  async verifyResetCode(data: VerifyCodeForm): Promise<void> {
    try {
      // /api/users/password/verify-code 대신 /api/users/verify-code 사용
      const response = await api.post("/api/users/verify-code", {
        email: data.email,
        verificationCode: data.verificationCode,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 비밀번호 재설정
  async resetPassword(data: PasswordResetForm): Promise<void> {
    try {
      const response = await api.post("/api/users/password/reset", {
        email: data.email,
        verificationCode: data.verificationCode,
        newPassword: data.newPassword,
        confirmPassword: data.newPasswordConfirm,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 회원 탈퇴
  async deleteUser(): Promise<{ message: string }> {
    try {
      const response = await api.delete("/api/users/delete");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 토큰 갱신
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await api.post<{ accessToken: string }>(
        "/api/users/token",
        {
          refreshToken,
        }
      );

      const { accessToken } = response.data;
      if (accessToken) {
        authUtils.setToken(accessToken);
      } else {
        throw new Error("토큰 갱신 응답에 새로운 액세스 토큰이 없습니다.");
      }

      return response.data;
    } catch (error) {
      authUtils.clearAll();
      throw handleApiError(error);
    }
  }

  // 카카오 계정 연동 API
  async linkKakaoAccount(
    email: string,
    name: string,
    profileImage?: string
  ): Promise<KakaoLinkResponse> {
    try {
      const response = await api.post("/api/users/kakao/link", {
        email,
        name,
        profileImage,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data.error || error.response.data;
        throw new Error(
          errorMsg === "카카오 계정으로 연동할 수 없는 계정입니다."
            ? "카카오 계정으로 연동할 수 없는 계정입니다. 관리자에게 문의하세요."
            : errorMsg
        );
      }
      throw handleApiError(error);
    }
  }
}

export const authService = new AuthService();
