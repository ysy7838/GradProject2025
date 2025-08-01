import {check} from "express-validator";
import {AUTH_MESSAGES} from "../../constants/message.js";
import {validateMiddleware} from "./validators.common.js";

// email
export const validateEmail = (field) => {
  return check(field)
    .trim()
    .notEmpty()
    .withMessage(AUTH_MESSAGES.ALL_INFO_REQUIRED)
    .isEmail()
    .withMessage(AUTH_MESSAGES.INVALID_EMAIL_FORMAT);
};

export const validateCode = check("verificationCode")
  .notEmpty()
  .withMessage(AUTH_MESSAGES.ALL_INFO_REQUIRED)
  .isLength({min: 6, max: 6})
  .withMessage(AUTH_MESSAGES.INVALID_CODE_FORMAT);

// password
const passwordRequirements = (value) => {
  if (value.length < 8 || value.length > 12) {
    throw new Error(AUTH_MESSAGES.INVALID_PASSWORD_FORMAT);
  }
  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecialChar = /[@$!%*?&]/.test(value);
  const typeCount = [hasLetter, hasDigit, hasSpecialChar].filter(Boolean).length;

  if (typeCount < 2) {
    throw new Error(AUTH_MESSAGES.INVALID_PASSWORD_FORMAT);
  }
  return true;
};

export const validateLoginPassword = check("password").trim().notEmpty().withMessage(AUTH_MESSAGES.ALL_INFO_REQUIRED);

export const validatePassword = (field) => {
  return check(field).trim().notEmpty().withMessage(AUTH_MESSAGES.ALL_INFO_REQUIRED).custom(passwordRequirements);
};

export const validateConfirmPassword = check("confirmPassword")
  .custom((value, {req}) => value === req.body.password)
  .withMessage(AUTH_MESSAGES.PASSWORD_CONFIRM_MISMATCH);

export const validateNewConfirmPassword = check("confirmNewPassword") // req.body.newPassword와 비교하도록 필드명 변경 필요
  .notEmpty()
  .withMessage(AUTH_MESSAGES.ALL_INFO_REQUIRED)
  .custom((value, {req}) => value === req.body.newPassword)
  .withMessage(AUTH_MESSAGES.NEW_PASSWORD_CONFIRM_MISMATCH);

// [User/Auth]
export const validateAuthEmail = [validateEmail("email"), validateMiddleware];

export const validateVerifyCode = [validateEmail("email"), validateCode, validateMiddleware];

export const validateSignup = [
  validateEmail("verifiedEmail"),
  validatePassword("password"),
  validateConfirmPassword,
  validateMiddleware,
];

export const validateLogin = [validateEmail("email"), validateLoginPassword, validateMiddleware];

export const validateResetPasswordEmail = [validateEmail("email"), validateMiddleware];

export const validateResetPassword = [
  validateEmail("email"),
  validateCode,
  validatePassword("newPassword"),
  validateNewConfirmPassword,
  validateMiddleware,
];
