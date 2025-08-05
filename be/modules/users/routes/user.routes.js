import {Router} from "express";
import {authenticate} from "../../middlewares/authenticate.js";
import UserController from "../controller/user.controller.js";
import {
  validateAuthEmail,
  validateVerifyCode,
  validateSignup,
  validateLogin,
  validateResetPasswordEmail,
  validateResetPassword,
} from "../../utils/validators/validators.user.js";

const router = Router();

// 이메일 인증번호 발송
router.post("/email", validateAuthEmail, UserController.authEmail);

// 회원가입
router.post("/verify-code", validateVerifyCode, UserController.verifyCode);
router.post("/signup", validateSignup, UserController.createUser);

// 회원탈퇴
router.delete("/delete", UserController.deleteUser);

// 로그인&로그아웃
router.post("/login", validateLogin, UserController.loginUser);
router.post("/logout",authenticate, UserController.logoutUser);
router.post("/refresh-token", UserController.refreshAccessToken);

// 비밀번호 재설정
router.post("/password/email", validateResetPasswordEmail, UserController.sendResetPasswordEmail);
router.post("/password/reset", validateResetPassword, UserController.resetPassword);

export default router;
