// src/hooks/useAuth.ts
import { useRecoilState } from "recoil";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/contexts/useToast";
import { userState, authUtils } from "@/store/auth";
import { authService } from "@/services/auth";
import { ApiError } from "@/utils/errorHandler";
import { jwtDecode } from "jwt-decode";
import type { LoginForm, SignupForm, User, TokenPayload } from "@/types/auth";

export const useAuth = () => {
  const [user, setUser] = useRecoilState(userState);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const extractUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.email.split("@")[0],
        // provider 정보는 토큰에 없으므로 마이페이지 API에서 가져올 예정
      };
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  const updateAuthState = async (
    userData: User | null,
    accessToken?: string,
    refreshToken?: string
  ) => {
    try {
      if (userData && accessToken) {
        // 토큰 저장
        authUtils.setToken(accessToken);

        // 디버그를 위한 로깅 추가
        console.log("[Auth] 토큰 저장 완료:", !!accessToken);

        if (refreshToken) {
          authUtils.setRefreshToken(refreshToken);
        }

        // 유저 데이터 저장
        authUtils.setStoredUser(userData);
        setUser(userData);

        // 디버그를 위한 로깅 추가
        console.log("[Auth] 유저 데이터 저장 완료:", !!userData);

        // 저장 확인
        const storedToken = authUtils.getToken();
        const storedUser = authUtils.getStoredUser();

        console.log("Auth State Update Check:", {
          tokenStored: !!storedToken,
          userStored: !!storedUser,
          recoilStateUpdated: !!user,
        });

        return true;
      } else {
        authUtils.clearAll();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Auth state update failed:", error);
      return false;
    }
  };

  const login = async (data: LoginForm, rememberMe?: boolean) => {
    try {
      const response = await authService.login(data, !!rememberMe);
      console.log("Login API Response:", response);

      const userData = extractUserFromToken(response.accessToken);
      if (!userData) {
        throw new Error("Failed to extract user data from token");
      }

      const updateSuccess = await updateAuthState(
        userData,
        response.accessToken,
        response.refreshToken
      );

      if (!updateSuccess) {
        throw new Error("Failed to update auth state");
      }

      if (rememberMe) {
        authUtils.setRememberMe(true);
      }

      if (rememberMe) {
        authUtils.setRememberMe(true);
      }

      // 👈 복구 상태 체크
      if (response.recovered) {
        setShowRecoveryModal(true);
      } else {
        showToast("로그인이 완료되었습니다.", "success");
        setTimeout(() => {
          navigate("/collections", { replace: true });
        }, 100);
      }

      return response;
    } catch (error) {
      console.error("Login failed:", error);
      updateAuthState(null);

      if (error instanceof ApiError) {
        showToast(error.message, "error");
      } else {
        showToast("로그인에 실패했습니다.", "error");
      }
      throw error;
    }
  };

  // 복구 모달 확인 핸들러 추가
  const handleRecoveryModalConfirm = () => {
    setShowRecoveryModal(false);
    showToast("로그인이 완료되었습니다.", "success");
    navigate("/collections", { replace: true });
  };

  const signup = async (data: SignupForm) => {
    try {
      await authService.signup(data);
      showToast("회원가입이 완료되었습니다. 로그인해주세요.", "success");
      navigate("/auth/login", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, "error");
      } else {
        showToast("회원가입에 실패했습니다.", "error");
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // 로그아웃 시도 전 현재 인증 상태 로깅
      console.log("[Auth] 로그아웃 시도. 현재 인증 상태:", {
        hasToken: !!authUtils.getToken(),
        hasUser: !!user,
      });

      // API 호출 - 로그아웃 요청
      await authService.logout();

      // 로컬 상태 및 저장소 정리
      await updateAuthState(null);
      showToast("로그아웃 되었습니다.", "success");

      // 로그아웃 후 로그인 페이지로 리디렉션
      navigate("/auth/login", { replace: true });
    } catch (error) {
      console.log(
        "로그아웃 중 에러가 발생했지만, 로그아웃 처리를 계속 진행합니다.",
        error
      );

      // 에러가 발생해도 로그아웃 처리는 진행
      await updateAuthState(null);
      showToast("로그아웃 중 오류가 발생했습니다.", "error");
      navigate("/auth/login", { replace: true });
    }
  };

  const checkAuthStatus = () => {
    const token = authUtils.getToken();
    const storedUser = authUtils.getStoredUser();

    if (token && storedUser && !user) {
      // 토큰과 사용자 정보는 있지만 상태에는 없는 경우 상태 업데이트
      console.log(
        "[Auth] 토큰과 사용자 정보가 있지만 상태에 없음. 상태 업데이트"
      );
      setUser(storedUser);
      return true;
    }

    if (!token && user) {
      // 토큰은 없지만 상태에는 사용자 정보가 있는 경우 상태 초기화
      console.log(
        "[Auth] 토큰이 없지만 상태에 사용자 정보가 있음. 상태 초기화"
      );
      updateAuthState(null);
      return false;
    }

    return !!token && !!user;
  };

  // 카카오 로그인 성공 후 처리
  const processKakaoLogin = async (token: string) => {
    try {
      console.log("[Auth] 카카오 로그인 처리 시작:", !!token);

      if (!token) {
        throw new Error("유효하지 않은 토큰입니다.");
      }

      // 토큰에서 사용자 정보 추출
      const userData = extractUserFromToken(token);
      if (!userData) {
        throw new Error("토큰에서 사용자 정보를 추출할 수 없습니다.");
      }

      // 카카오 로그인이므로 provider 정보 추가
      userData.provider = "kakao";

      // 인증 상태 업데이트
      const updateSuccess = await updateAuthState(userData, token);
      if (!updateSuccess) {
        throw new Error("인증 상태 업데이트에 실패했습니다.");
      }

      // 자동 로그인 설정
      authUtils.setRememberMe(true);

      showToast("카카오 로그인이 완료되었습니다.", "success");
      return true;
    } catch (error) {
      console.error("[Auth] 카카오 로그인 처리 실패:", error);
      updateAuthState(null);
      showToast(
        error instanceof Error
          ? error.message
          : "카카오 로그인 처리 중 오류가 발생했습니다.",
        "error"
      );
      return false;
    }
  };

  return {
    user,
    login,
    signup,
    logout,
    setUser: (userData: User) => setUser(userData),
    isAuthenticated: checkAuthStatus(),
    processKakaoLogin,
    showRecoveryModal,
    handleRecoveryModalConfirm,
  };
};
