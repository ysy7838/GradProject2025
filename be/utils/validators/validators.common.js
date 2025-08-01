import {check, validationResult} from "express-validator";
import {BadRequestError} from "../customError.js";
import {COMMON_MESSAGES} from "../../constants/message.js";

// Middleware
export const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }
  next();
};

// ObjectId
export const validateObjectId = (field) => {
  return check(field).isMongoId().withMessage(`${field}, ${COMMON_MESSAGES.INVALID_ID_FORMAT}`);
};

export const validateObjectIdArray = (field) => {
  return check(field)
    .isArray()
    .withMessage(`${field}, ${COMMON_MESSAGES.INVALID_ARRAY_FORMAT}`)
    .notEmpty()
    .withMessage(COMMON_MESSAGES.ARRAY_EMPTY)
    .custom((value) => {
      if (Array.isArray(value)) {
        const isValid = value.every((item) => /^[0-9a-fA-F]{24}$/.test(item));
        if (!isValid) {
          throw new Error(`${field}, ${COMMON_MESSAGES.INVALID_ID_FORMAT}`);
        }
      }
      return true;
    });
};

export const validateUpdatePayload = (field = "payload") => {
  return check(field)
    .custom((value) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(`${field}는 객체 형식이어야 합니다.`);
      }
      if (Object.keys(value).length === 0) {
        throw new Error("업데이트할 필드가 필요합니다.");
      }
      return true;
    })
    .withMessage(`${field}는 업데이트할 필드를 포함해야 합니다.`);
};
