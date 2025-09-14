// src/store/theme.ts
import { atom } from "recoil";

// 테마 타입 정의
export type Theme = 'light' | 'dark';

// 로컬 스토리지에서 테마 상태 초기화
const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
    return savedTheme;
  }
  
  // 시스템 테마 기본값 적용
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 테마 상태 atom 생성
export const themeState = atom<Theme>({
  key: "themeState",
  default: getInitialTheme(),
});