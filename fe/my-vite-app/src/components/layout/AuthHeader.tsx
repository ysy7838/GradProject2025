// src/components/layout/AuthHeader.tsx
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState, authUtils } from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";

export default function AuthHeader() {
  const user = useRecoilValue(userState);
  const isAuthenticated = !!user || !!authUtils.getToken();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white dark:bg-dark-bg shadow-sm rounded-bl-[48px] rounded-br-[48px] shadow-[0px_4px_10px_0px_rgba(181,184,181,0.10)] dark:shadow-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PC 버전 헤더 */}
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center h-16 mt-4">
            {/* 로고 */}
            <div className="flex-1">
              <Link to="/" className="flex items-center">
                <img
                  src="/images/icon_with_text.svg"
                  alt="RefHub"
                  className="h-8"
                />
              </Link>
            </div>

            {/* 중간 공간 - MainHeader와 구조 일치를 위해 추가 */}
            <div className="flex-1 flex justify-center space-x-8">
              {/* 내용은 비어있지만 구조상 필요 */}
            </div>

            {/* 우측 버튼 (로그인 or 로그아웃) */}
            <div className="flex-1 flex justify-end">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 버전 헤더 */}
        <div className="flex flex-col sm:hidden">
          {/* 로고와 버튼 */}
          <div className="flex justify-between items-center w-full pt-4">
            <Link to="/" className="flex items-center">
              <img
                src="/images/icon_with_text.svg"
                alt="RefHub"
                className="h-8"
              />
            </Link>

            {/* 로그인/로그아웃 버튼 */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
              >
                로그인
              </Link>
            )}
          </div>

          {/* 하단 네비게이션(필요 없으므로 공간만 확보) */}
          <div className="mt-4 mb-2"></div>
        </div>
      </div>
    </header>
  );
}
