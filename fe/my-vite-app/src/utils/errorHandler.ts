// src/utils/errorHandler.ts
import { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/auth";
import type { ReferenceApiError } from "@/types/reference";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const ERROR_MESSAGES = {
  // 계정 관련 오류 메시지
  ACCOUNT: {
    INVALID_CREDENTIALS: "계정 정보가 올바르지 않습니다. 다시 시도해주세요.",
    NOT_FOUND: "등록되지 않은 계정입니다. 회원가입을 진행해주세요.",
    PASSWORD_FORMAT: "계정 정보가 올바르지 않습니다. 다시 시도해주세요.", // 문구 통일
  },
  // 기술적 오류 메시지
  TECHNICAL: {
    NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
    SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    UNAUTHORIZED: "로그인이 필요한 서비스입니다.",
    FORBIDDEN: "접근 권한이 없습니다.",
    NOT_FOUND: "요청하신 리소스를 찾을 수 없습니다.",
    DEFAULT: "알 수 없는 오류가 발생했습니다.",
    FILE_SIZE_EXCEEDED: "파일 크기가 제한을 초과했습니다.",
    INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다.",
    VALIDATION_ERROR: "입력값을 확인해주세요.",
  },
};

// 오류 유형 확인 함수
export const isAccountError = (message: string): boolean => {
  const accountErrorMessages = Object.values(ERROR_MESSAGES.ACCOUNT);
  return accountErrorMessages.some((errMsg) => message.includes(errMsg));
};

export const handleApiError = (error: unknown): never => {
  console.error("API Error:", error);

  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data as
      | ApiErrorResponse
      | ReferenceApiError;
    let message: string;

    // API에서 반환하는 실제 에러 메시지를 우선적으로 사용
    if (errorData) {
      if (typeof errorData === "string") {
        message = errorData;
      } else if ("error" in errorData) {
        message = errorData.error;
      } else {
        // 상태 코드별 기본 에러 메시지
        switch (status) {
          case 400:
            // 계정 관련 오류 메시지 일관성 유지
            message = ERROR_MESSAGES.ACCOUNT.INVALID_CREDENTIALS;
            break;
          case 401:
            message = ERROR_MESSAGES.TECHNICAL.UNAUTHORIZED;
            break;
          case 403:
            message = ERROR_MESSAGES.TECHNICAL.FORBIDDEN;
            break;
          case 404:
            // 계정 관련 404 처리
            if (error.config?.url?.includes("/api/users")) {
              message = ERROR_MESSAGES.ACCOUNT.NOT_FOUND;
            } else {
              message = ERROR_MESSAGES.TECHNICAL.NOT_FOUND;
            }
            break;
          case 413:
            message = ERROR_MESSAGES.TECHNICAL.FILE_SIZE_EXCEEDED;
            break;
          case 415:
            message = ERROR_MESSAGES.TECHNICAL.INVALID_FILE_TYPE;
            break;
          case 422:
            message = ERROR_MESSAGES.TECHNICAL.VALIDATION_ERROR;
            break;
          case 500:
            message = ERROR_MESSAGES.TECHNICAL.SERVER_ERROR;
            break;
          default:
            message = error.message || ERROR_MESSAGES.TECHNICAL.DEFAULT;
        }
      }
      throw new ApiError(message, status, error.code);
    }
  }

  if (error instanceof Error) {
    throw new ApiError(error.message, 500);
  }

  throw new ApiError(ERROR_MESSAGES.TECHNICAL.DEFAULT, 500);
};
