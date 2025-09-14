// src/utils/api.ts
import axios, { AxiosHeaders } from "axios";
import { authUtils } from "@/store/auth";
import { handleApiError } from "./errorHandler";

// 환경에 따른 baseURL 설정
const getBaseUrl = () => {
  // Vite 개발 환경에서는 개발 서버 사용
  if (import.meta.env.DEV) {
    console.log("개발 환경 감지, 개발 서버 API 사용 (http://localhost:3000)");
    return "http://localhost:3000";
  }

  // 운영 환경에서는 기존 API URL 사용
  console.log("운영 환경 감지, 운영 서버 API 사용 (api.smart-memo.com)");
  return "http://localhost:3000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // CORS 요청에 credential 포함
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = authUtils.getToken();

    if (token) {
      // 토큰이 있는 경우 Authorization 헤더에 추가
      config.headers.Authorization = `Bearer ${token}`;

      // 디버그를 위한 로깅
      if (import.meta.env.DEV) {
        console.log("[API] 인증 토큰 적용:", config.url);
      }
    } else if (import.meta.env.DEV) {
      console.log("[API] 인증 토큰 없음:", config.url);
    }

    // FormData를 포함한 요청의 경우 Content-Type 헤더 삭제
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];

      if (import.meta.env.DEV) {
        console.log("[API] FormData 요청 감지, Content-Type 헤더 제거");
      }
    }

    // 개발 모드에서 요청 로깅 (디버깅용)
    if (import.meta.env.DEV) {
      console.log(
        `🚀 ${config.method?.toUpperCase()} 요청:`,
        `${config.baseURL}${config.url}`,
        config.data ? "데이터 포함" : "데이터 없음"
      );
    }

    return config;
  },
  (error) => {
    console.error("[API] 요청 인터셉터 오류:", error);
    return handleApiError(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    // 개발 모드에서 응답 로깅
    if (import.meta.env.DEV) {
      console.log(
        `✅ 응답 성공:`,
        `${response.config.url}`,
        `상태: ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      // 개발 모드에서 오류 로깅
      if (import.meta.env.DEV) {
        console.error(
          "🔴 API 응답 오류:",
          error.response?.status,
          error.message,
          `URL: ${error.config?.url}`
        );
      }

      // 401 오류 처리 (인증 실패)
      if (error.response?.status === 401) {
        try {
          console.log("[API] 토큰 갱신 시도");
          const refreshToken = authUtils.getRefreshToken();

          if (!refreshToken) {
            console.log("[API] 리프레시 토큰 없음, 인증 오류 처리");
            throw new Error("리프레시 토큰이 없습니다.");
          }

          // baseURL은 환경에 따라 달라질 수 있으므로 현재 설정된 baseURL 사용
          const response = await axios.post(
            `${api.defaults.baseURL}/api/users/token`,
            { refreshToken },
            { withCredentials: true }
          );

          if (response.data.accessToken) {
            console.log("[API] 토큰 갱신 성공, 새 토큰 저장");
            authUtils.setToken(response.data.accessToken);

            if (error.config) {
              // 헤더 처리 수정 - AxiosHeaders 사용
              if (!error.config.headers) {
                error.config.headers = new AxiosHeaders();
              }

              error.config.headers.set(
                "Authorization",
                `Bearer ${response.data.accessToken}`
              );

              console.log("[API] 실패한 요청 재시도");
              return axios(error.config);
            }
          } else {
            console.error("[API] 토큰 갱신 응답에 새 토큰이 없음");
            throw new Error("토큰 갱신에 실패했습니다.");
          }
        } catch (refreshError) {
          console.error("[API] 토큰 갱신 실패:", refreshError);

          // 토큰 관련 데이터 정리
          authUtils.clearAll();
          console.log("[API] 인증 데이터 초기화 완료");

          // 토스트 메시지 표시를 위한 이벤트 발생
          const event = new CustomEvent("auth-error", {
            detail: {
              message: "인증 세션이 만료되었습니다. 다시 로그인해주세요.",
            },
          });
          window.dispatchEvent(event);
          console.log("[API] 인증 오류 이벤트 발생");

          // 즉시 로그인 페이지로 리디렉션
          window.location.href = "/auth/login";

          return Promise.reject(refreshError);
        }
      }

      // 특정 오류 상태 코드에 대한 사용자 정의 메시지
      if (error.response?.status === 413) {
        return handleApiError({
          ...error,
          response: {
            ...error.response,
            data: { error: "파일 크기가 제한을 초과했습니다." },
          },
        });
      }

      if (error.response?.status === 415) {
        return handleApiError({
          ...error,
          response: {
            ...error.response,
            data: { error: "지원하지 않는 파일 형식입니다." },
          },
        });
      }

      // 서버 오류
      if (error.response?.status === 500) {
        console.error("[API] 서버 오류 응답:", error.response.data);
      }

      // 네트워크 오류
      if (error.code === "ECONNABORTED") {
        console.error("[API] 요청 시간 초과:", error.message);
        return handleApiError({
          ...error,
          response: {
            ...error.response,
            data: {
              error:
                "서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요.",
            },
          },
        });
      }
    }

    return handleApiError(error);
  }
);

export default api;
