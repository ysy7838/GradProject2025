// src/hooks/useTheme.ts
import { useRecoilState } from "recoil";
import { useEffect } from "react";
import { themeState } from "@/store/theme";

export function useTheme() {
  const [theme, setTheme] = useRecoilState(themeState);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // 테마 변경 시 localStorage 저장 및 HTML 속성 업데이트
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, toggleTheme };
}