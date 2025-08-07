import userRepository from "../repository/user.repository.js";
import bcrypt, { compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import {fileURLToPath} from "url";
import {smtpTransport} from "../../../config/email.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ExternalServiceError,
} from "../../../utils/customError.js";
import {AUTH_MESSAGES} from "../../../constants/message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve();

const subjectSignUp = "📝똑똑한 메모📝 회원 가입 인증 번호";
const subjectPasswordReset = "📝똑똑한 메모📝 비밀번호 재설정 인증 번호";

// helper function 이메일 발송 함수
const sendVerificationEmail = async (email, verificationCode, subject) => {
  let templateFile;
  if (subject === subjectSignUp) {
    templateFile = "authEmail.ejs";
  } else if (subject === subjectPasswordReset) {
    templateFile = "authPassword.ejs";
  }
  const emailTemplatePath = path.join(appDir, "templates", templateFile);
  const emailTemplate = await ejs.renderFile(emailTemplatePath, {
    authCode: verificationCode,
    email,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: emailTemplate,
    // attachments: [
    //   {
    //     filename: "logo.png",
    //     path: path.join(appDir, "templates", "logo.png"),
    //     cid: "logo",
    //   },
    // ],
  };

  try {
    return await smtpTransport.sendMail(mailOptions);
  } catch (error) {
    throw new ExternalServiceError(AUTH_MESSAGES.EMAIL_SEND_ERROR);
  }
};

class UserService {
  constructor() {
    this.userRepository = userRepository;
  }

  // --- 이메일 인증번호 발송 ---
  async sendAuthEmail(data) {
    const {email, subjectType} = data;
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationExpires = Date.now() + 1000 * 60 * 5;

    const subject = subjectType === "signup" ? subjectSignUp : subjectPasswordReset;
    let user = await this.userRepository.findOneForUpdate({email});
    console.log(`user: ${user}`);

    if (subjectType === "signup") {
      if (user && user.password) {
        throw new ConflictError(AUTH_MESSAGES.EMAIL_ALREADY_REGISTERED);
      }
      if (user) {
        user.verificationCode = verificationCode;
        user.verificationExpires = verificationExpires;
        await this.userRepository.saveUser(user);
      } else {
        await this.userRepository.create({
          email,
          verificationCode,
          verificationExpires,
        });
      }
    } else if (subjectType === "resetPassword") {
      if (!user) {
        throw new NotFoundError(AUTH_MESSAGES.INVALID_CREDENTIALS);
      }
      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      await this.userRepository.saveUser(user);
    }

    await sendVerificationEmail(email, verificationCode, subject);
    return true;
  }

  // --- 인증번호 검증 ---
  async verifyCode(data) {
    const {email, verificationCode} = data;
    const user = await this.userRepository.findOne({email});

    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_NOT_FOUND);
    }
    if (user.verificationExpires < Date.now()) {
      throw new BadRequestError(AUTH_MESSAGES.CODE_EXPIRED);
    }
    if (user.verificationCode !== parseInt(verificationCode, 10)) {
      throw new BadRequestError(AUTH_MESSAGES.CODE_MISMATCH);
    }
    return user;
  }

  // --- 회원가입 완료 ---
  async signupUser(data) {
    const {verifiedEmail, password} = data;
    const user = await this.userRepository.findOneForUpdate({email: verifiedEmail});

    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_NOT_FOUND);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await this.userRepository.saveUser(user);
    return true;
  }

  // --- 로그인 ---
  async loginUser(data) {
    const {email, password, autoLogin} = data;
    const user = await this.userRepository.findOneForUpdate({email});

    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = jwt.sign({id: user._id, email: user.email}, process.env.JWT_SECRET, {expiresIn: "1h"});

    let refreshToken = null;
    if (autoLogin) {
      refreshToken = jwt.sign({id: user._id, email: user.email}, process.env.JWT_REFRESH_SECRET, {expiresIn: "7d"});
      user.refreshToken = refreshToken;
      await this.userRepository.saveUser(user);
    }

    return {accessToken, refreshToken, autoLogin};
  }

  // --- 로그아웃 ---
  async logoutUser(data) {
    const {userId} = data;
    const user = await this.userRepository.findByIdForUpdate(userId);
    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_INFO_NOT_FOUND);
    }
    user.refreshToken = "";
    await this.userRepository.saveUser(user);
    return true;
  }

  // --- 토큰 갱신 ---
  async refreshAccessToken(data) {
    const {refreshToken} = data;
    if (!refreshToken) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await this.userRepository.findUserByIdWithRefreshToken(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
      }

      const newAccessToken = jwt.sign({id: user._id, email: user.email}, process.env.JWT_SECRET, {expiresIn: "1h"});
      return {accessToken: newAccessToken};
    } catch (error) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  // --- 회원탈퇴 --- (즉시 탈퇴 및 모든 데이터 삭제)
  async deleteUser(data) {
    const {userId} = data;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_INFO_NOT_FOUND);
    }

    await this.userRepository.deleteUserMemoFavorites(user._id);
    await this.userRepository.deleteUserMemos(user._id);
    await this.userRepository.deleteUserCategories(user._id);
    await this.userRepository.deleteOne({_id: user._id});

    return true;
  }

  // --- 비밀번호 재설정 관련 ---
  async sendResetPasswordEmail(data) {
    const {email} = data;
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const verificationExpires = Date.now() + 1000 * 60 * 5;

    const user = await this.userRepository.findOneForUpdate({email});

    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await this.userRepository.saveUser(user);

    await sendVerificationEmail(email, verificationCode, subjectPasswordReset);
    return true;
  }

  async resetPassword(data) {
    const {email, verificationCode, newPassword} = data;
    const user = await this.userRepository.findOneForUpdate({email});

    if (!user) {
      throw new NotFoundError(AUTH_MESSAGES.USER_NOT_FOUND);
    }
    if (user.verificationExpires < Date.now()) {
      throw new BadRequestError(AUTH_MESSAGES.CODE_EXPIRED);
    }
    if (user.verificationCode !== parseInt(verificationCode, 10)) {
      throw new BadRequestError(AUTH_MESSAGES.CODE_MISMATCH);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await this.userRepository.saveUser(user);
    return true;
  }
}

export default new UserService();