// src/components/layout/ThemeProvider.tsx
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { themeState } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useRecoilState(themeState);

  useEffect(() => {
    // 다크모드일 때 HTML에 class 추가
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 로컬 스토리지에 테마 상태 저장
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  return <>{children}</>;
}