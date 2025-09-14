// src/components/layout/Layout.tsx
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userState, authUtils } from "@/store/auth";
import AuthHeader from "./AuthHeader";
import MainHeader from "./MainHeader";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();
  const user = useRecoilValue(userState);
  const isAuthenticated = !!user || !!authUtils.getToken();

  // 현재 경로 로깅 추가 (디버깅용)
  console.log("[Layout] 현재 경로:", location.pathname);
  console.log("[Layout] 인증 상태:", isAuthenticated);

  // 카카오 로그인 콜백 페이지 경로 확인
  const isKakaoCallbackPage = location.pathname === "/users/kakao-login";

  // 페이지 타입 식별
  const isAuthPage = location.pathname.startsWith("/auth/");
  const isLoginPage = location.pathname === "/auth/login";
  const isSignupPage = location.pathname === "/auth/signup";
  const isPasswordResetPage = location.pathname === "/auth/reset-password";
  const isHomePage =
    location.pathname === "/collections" ||
    location.pathname === "/references" ||
    location.pathname === "/user/mypage" ||
    location.pathname === "/mypage";

  // 카카오 콜백 페이지는 항상 접근 허용
  if (isKakaoCallbackPage) {
    console.log("[Layout] 카카오 로그인 콜백 페이지 접근 허용");
    return <Outlet />;
  }

  // 인증이 필요한 페이지에서 비로그인 상태일 경우 로그인 페이지로 리다이렉트
  if (!isAuthPage && !isKakaoCallbackPage && !user && !authUtils.getToken()) {
    console.log("[Layout] 인증 필요 페이지 접근 시도, 로그인으로 리다이렉트");
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  // 로그인 상태에서 인증 페이지 접근 시 컬렉션 페이지로 리다이렉트
  // 비밀번호 재설정 페이지는 항상 접근 가능하도록 예외 처리
  if (isAuthPage && !isPasswordResetPage && user && !isLoginPage) {
    console.log(
      "[Layout] 로그인 상태에서 인증 페이지 접근, 컬렉션으로 리다이렉트"
    );
    return <Navigate to="/collections" replace />;
  }

  // 검색창을 표시할지 결정
  const shouldShowSearchBar = () => {
    const hideSearchBarPatterns = [
      /\/auth\/.*/, // 모든 auth 페이지
      /\/users\/kakao-login/, // 카카오 로그인 콜백 페이지
      /\/mypage$/, // 마이페이지
      /\/collections\/[^/]+$/, // /collections/:id
      /\/references\/[^/]+$/, // /references/:id
      /\/references\/[^/]+\/edit$/, // /references/:id/edit
      /\/references\/new$/, // /references/new
    ];

    return !hideSearchBarPatterns.some((pattern) =>
      pattern.test(location.pathname)
    );
  };

  // 인증 상태에 따라 헤더 타입 결정
  // 인증된 사용자는 비밀번호 재설정 페이지를 포함하여 MainHeader 사용
  const shouldUseMainHeader =
    isAuthenticated &&
    (!isAuthPage || isPasswordResetPage) &&
    !isKakaoCallbackPage;

  // 인증되지 않은 사용자는 Auth 페이지들에서만 AuthHeader 사용
  // 로그인 페이지에서는 헤더를 표시하지 않도록 수정
  const shouldUseAuthHeader =
    !isAuthenticated &&
    (isSignupPage || isPasswordResetPage) &&
    !isLoginPage &&
    !isKakaoCallbackPage;

  // 카카오 로그인 콜백 페이지에서는 헤더를 표시하지 않음
  if (isKakaoCallbackPage) {
    console.log("[Layout] 카카오 로그인 콜백 페이지 - 헤더 없음");
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAF9]">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAF9]">
      {shouldUseMainHeader && (
        <MainHeader shouldShowSearchBar={shouldShowSearchBar()} />
      )}
      {shouldUseAuthHeader && <AuthHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isHomePage && <Footer />}
    </div>
  );
}
