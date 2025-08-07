import userService from "../service/user.service.js";
import asyncHandler from "express-async-handler";
import {AUTH_MESSAGES, USER_MESSAGES} from "../../../constants/message.js";

class UserController {
  constructor() {
    this.userService = userService;

    this.authEmail = asyncHandler(this.authEmail.bind(this));
    this.verifyCode = asyncHandler(this.verifyCode.bind(this));
    this.createUser = asyncHandler(this.createUser.bind(this));
    this.loginUser = asyncHandler(this.loginUser.bind(this));
    this.logoutUser = asyncHandler(this.logoutUser.bind(this));
    this.refreshAccessToken = asyncHandler(this.refreshAccessToken.bind(this));
    this.deleteUser = asyncHandler(this.deleteUser.bind(this));
    this.sendResetPasswordEmail = asyncHandler(this.sendResetPasswordEmail.bind(this));
    this.resetPassword = asyncHandler(this.resetPassword.bind(this));
  }

  // 이메일 인증번호 발송
  async authEmail(req, res) {
    const {email} = req.body;
    const data = {email, subjectType: "signup"};
    await this.userService.sendAuthEmail(data);
    res.status(200).send(AUTH_MESSAGES.EMAIL_SENT_SUCCESS);
  }

  // 인증번호 검증
  async verifyCode(req, res) {
    const {email, verificationCode} = req.body;
    const data = {email, verificationCode};
    const user = await this.userService.verifyCode(data);
    req.body.verifiedEmail = user.email;
    res.status(200).send(AUTH_MESSAGES.CODE_VERIFIED);
  }

  // 회원가입
  async createUser(req, res) {
    const {verifiedEmail, password} = req.body;
    const data = {verifiedEmail, password};
    await this.userService.signupUser(data);
    res.status(200).send(AUTH_MESSAGES.SIGNUP_SUCCESS);
  }

  // 로그인
  async loginUser(req, res) {
    const {email, password, autoLogin = false} = req.body;
    const data = {email, password, autoLogin};
    const {
      accessToken,
      refreshToken,
      autoLogin: autoLoginResult,
    } = await this.userService.loginUser(data);

    res.status(200).json({
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      accessToken,
      refreshToken,
      autoLogin: autoLoginResult,
    });
  }

  // 로그아웃
  async logoutUser(req, res) {
    const userId = req.user.id;
    const data = {userId};
    await this.userService.logoutUser(data);
    res.status(200).json({message: AUTH_MESSAGES.LOGOUT_SUCCESS});
  }

  // 토큰 갱신
  async refreshAccessToken(req, res) {
    const refreshToken = req.header("Authorization")?.replace("Bearer ", "");
    const data = {refreshToken};
    const {accessToken} = await this.userService.refreshAccessToken(data);
    res.status(200).json({accessToken});
  }

  // 회원탈퇴
  async deleteUser(req, res) {
    const userId = req.user.id;
    const data = {userId};
    await this.userService.deleteUser(data);
    res.status(200).send(USER_MESSAGES.ACCOUNT_DELETED);
  }

  // 비밀번호 재설정 위한 인증번호 발송
  async sendResetPasswordEmail(req, res) {
    const {email} = req.body;
    const data = {email};
    await this.userService.sendResetPasswordEmail(data);
    res.status(200).send(AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT_SUCCESS);
  }

  // 비밀번호 재설정
  async resetPassword(req, res) {
    const {email, verificationCode, newPassword} = req.body;
    const data = {email, verificationCode, newPassword};
    await this.userService.resetPassword(data);
    res.status(200).send(AUTH_MESSAGES.PASSWORD_RESET_SUCCESS);
  }
}

export default new UserController();