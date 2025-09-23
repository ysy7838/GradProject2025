// tailwind.config.ts
import type {Config} from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 프로젝트의 모든 파일에서 Tailwind 클래스를 감지하도록 설정
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1ABC9C", // 기본 primary 색상
          dark: "#16a085", // 조금 더 어두운 버전 (hover 시 사용)
          light: "#A3E4D7", // 조금 더 밝은 버전 (disabled, secondary 등에 사용)
          0: "#A3E4D7", // 조금 더 밝은 버전 (disabled, secondary 등에
          100: "#1ABC9C", // 기본 primary 색상
          200: "#16a085", // 조금 더 어두운 버전 (hover 시 사용)
        },
        gradient: {
          100: "#b3e9deff", // 시작 색상 (기존 primary와 유사한 밝은 청록)
          0: "#ffffffff", // 끝 색상 (매우 연한 청록)
        },
        // 그레이스케일 색상 재정의 (디자인에 맞게)
        gray: {
          0: "#FFFFFF",
          50: "#F7F7F7",
          100: "#F2F2F2",
          200: "#E6E6E6",
          300: "#DDDDDD", // border 색상
          400: "#B3B3B3",
          500: "#8D8D8D", // placeholder, helper text
          600: "#666666",
          700: "#404040", // label, body text
          800: "#2C2C2C",
          900: "#111111", // heading text
        },
        danger: "#E53E3E", // 에러 색상
      },
      fontFamily: {
        sans: ["Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;