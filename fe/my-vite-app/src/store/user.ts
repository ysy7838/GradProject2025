// src/store/user.ts
import { atom } from "recoil";

export interface UserProfile {
  name: string;
  email: string;
  profileImage?: string | null;
  provider?: "local" | "kakao"; // 추가: 로그인 타입
}

export const userProfileState = atom<UserProfile | null>({
  key: "userProfileState",
  default: null,
});
