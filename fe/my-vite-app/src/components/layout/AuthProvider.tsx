import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { useToast } from "@/contexts/useToast";
import { userState, authUtils } from "@/store/auth";
import { authService } from "@/services/auth";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import type { TokenPayload } from "@/types/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useSetRecoilState(userState);
  const { showToast } = useToast();

  useEffect(() => {
    // 토큰 유효성 검사 함수
    const isTokenValid = (token: string): boolean => {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        return decoded.exp * 1000 > Date.now();
      } catch (error) {
        console.error("Token validation error:", error);
        return false;
      }
    };

    // 인증 에러 이벤트 핸들러
    const handleAuthError = (event: CustomEvent) => {
      showToast(event.detail.message, "error");
    };

    // 인증 에러 이벤트 리스너 등록
    window.addEventListener('auth-error', handleAuthError as EventListener);

    // Axios 응답 인터셉터
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = authUtils.getRefreshToken();
            if (!refreshToken) {
              throw new Error("Refresh token not found");
            }

            const { accessToken } = await authService.refreshToken(refreshToken);
            authUtils.setToken(accessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return axios(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            authUtils.clearAll();
            setUser(null);
            
            // 토스트 메시지 표시 후 리디렉션
            showToast("인증이 만료되었습니다. 다시 로그인해주세요.", "error");
            setTimeout(() => {
              window.location.href = "/auth/login";
            }, 100);
            
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // 초기 인증 상태 설정
    const initializeAuth = async () => {
      try {
        const token = authUtils.getToken();
        const refreshToken = authUtils.getRefreshToken();
        const storedUser = authUtils.getStoredUser();

        // 인증 정보가 전혀 없는 경우
        if (!token && !refreshToken && !storedUser) {
          authUtils.clearAll();
          setUser(null);
          return;
        }

        // 액세스 토큰이 없지만 사용자 정보가 있는 경우
        if (!token && storedUser) {
          if (refreshToken) {
            try {
              const { accessToken } = await authService.refreshToken(refreshToken);
              authUtils.setToken(accessToken);
              setUser(storedUser);
              return;
            } catch (refreshError) {
              console.error("Token refresh failed during initialization:", refreshError);
              throw refreshError;
            }
          } else {
            throw new Error("No valid authentication tokens available");
          }
        }

        // 토큰이 만료된 경우
        if (token && !isTokenValid(token)) {
          if (refreshToken) {
            const { accessToken } = await authService.refreshToken(refreshToken);
            authUtils.setToken(accessToken);
            setUser(storedUser);
          } else {
            throw new Error("Token expired and no refresh token available");
          }
        } else if (token && storedUser) {
          // 유효한 토큰과 사용자 정보가 있는 경우
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        authUtils.clearAll();
        setUser(null);
        
        // 초기화 실패 시 사용자에게 알림
        showToast("인증 정보 초기화에 실패했습니다. 다시 로그인해주세요.", "error");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 100);
      }
    };

    // 초기 인증 상태 설정 실행
    initializeAuth();

    // 클린업 함수
    return () => {
      axios.interceptors.response.eject(interceptor);
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, [setUser, showToast]);

  return <>{children}</>;
}