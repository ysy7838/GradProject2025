// utils/customError.js
class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends CustomError {
  constructor(message = "잘못된 요청입니다.") {
    super(message, 400);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = "인증되지 않은 사용자입니다.") {
    super(message, 401);
  }
}

class ForbiddenError extends CustomError {
  constructor(message = "접근 권한이 없습니다.") {
    super(message, 403);
  }
}

class NotFoundError extends CustomError {
  constructor(message = "리소스를 찾을 수 없습니다.") {
    super(message, 404);
  }
}

class ConflictError extends CustomError {
  constructor(message = "데이터 충돌이 발생했습니다.") {
    super(message, 409);
  }
}

class ExternalServiceError extends CustomError {
  constructor(message = "외부 서비스 처리 중 오류가 발생했습니다.", statusCode = 500) {
    super(message, statusCode);
    this.name = "ExternalServiceError";
  }
}

class InternalServerError extends CustomError {
  constructor(message = "서버 내부 오류가 발생했습니다.") {
    super(message, 500);
  }
}

export {
  CustomError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  InternalServerError,
};
