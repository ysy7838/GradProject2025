// src/components/layout/PublicRoute.tsx
import { Navigate } from "react-router-dom";
import { authUtils } from "@/store/auth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  // 현재 인증 상태 확인 (토큰이 있는지)
  const isAuthenticated = !!authUtils.getToken();
  
  // 인증된 사용자는 메인 페이지(컬렉션)로 리디렉션
  if (isAuthenticated) {
    return <Navigate to="/collections" replace />;
  }
  
  // 인증되지 않은 사용자는 로그인 페이지로 접근 가능
  return <>{children}</>;
}