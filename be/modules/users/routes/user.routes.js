import {Router} from "express";
import {authenticate} from "../../../middlewares/authenticate.js";
import {
  validateAuthEmail,
  validateVerifyCode,
  validateSignup,
  validateLogin,
  validateResetPasswordEmail,
  validateResetPassword,
} from "../../../utils/validators/validators.user.js";

export default (userController) => {
  const router = Router();

  // 이메일 인증번호 발송
  router.post("/email", validateAuthEmail, userController.authEmail);

  // 회원가입
  router.post("/verify-code", validateVerifyCode, userController.verifyCode);
  router.post("/signup", validateSignup, userController.createUser);

  // 회원탈퇴
  router.delete("/delete", authenticate, userController.deleteUser);

  // 로그인&로그아웃
  router.post("/login", validateLogin, userController.loginUser);
  router.post("/logout", authenticate, userController.logoutUser);
  router.post("/refresh-token", userController.refreshAccessToken);

  // 비밀번호 재설정
  router.post("/password/email", validateResetPasswordEmail, userController.sendResetPasswordEmail);
  router.post("/password/reset", validateResetPassword, userController.resetPassword);

  return router;
};
