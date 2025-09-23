// src/router.tsx
import {createBrowserRouter, type RouteObject} from "react-router-dom";
import Layout from "@/components/layout/Layout";
import {PublicRoute} from "@/components/layout/PublicRoute";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import NotFoundRedirect from "@/components/layout/NotFoundRedirect";

// 페이지 컴포넌트 import
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import MemoCreatePage from "@/pages/memo/MemoCreatePage";
import MemoDetailPage from "@/pages/memo/MemoDetailPage";
import MemoEditPage from "@/pages/memo/MemoEditPage";

// 인증 관련 라우트
const authRoutes: RouteObject[] = [
  {
    path: "login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "signup",
    element: (
      <PublicRoute>
        <SignupPage />
      </PublicRoute>
    ),
  },
];

const memoRoutes: RouteObject[] = [
  {
    path: "new",
    element: (
      <ProtectedRoute>
        <MemoCreatePage /> {/* 메모 생성 페이지 */}
      </ProtectedRoute>
    ),
  },
  {
    path: ":id",
    element: (
      <ProtectedRoute>
        <MemoDetailPage /> {/* 메모 상세 조회 페이지 */}
      </ProtectedRoute>
    ),
  },
  {
    path: ":id/edit",
    element: (
      <ProtectedRoute>
        <MemoEditPage /> {/* 메모 수정 페이지 */}
      </ProtectedRoute>
    ),
  },
];

// 메인 라우터 설정
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundRedirect />,
    children: [
      {
        path: "auth",
        children: authRoutes,
      },
      // 메모 라우트 추가
      {
        path: "memos",
        children: memoRoutes,
      },
      // 메인 홈 페이지 등 추가
      // {
      //   path: "/",
      //   element: <ProtectedRoute><HomePage /></ProtectedRoute>,
      // }
    ],
  },
]);
