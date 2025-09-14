// src/components/layout/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userState, authUtils } from '@/store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useRecoilValue(userState);
  const token = authUtils.getToken();
  const location = useLocation();
  
  if (!user && !token) {
    // 현재 위치 정보를 state로 전달하여 로그인 후 원래 페이지로 돌아갈 수 있게 함
    console.log('Protected route: No auth, redirecting to login');
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
}