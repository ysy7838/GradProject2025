// src/router.tsx
import {createBrowserRouter, type RouteObject} from "react-router-dom";
import Layout from "@/components/layout/Layout";
import {PublicRoute} from "@/components/layout/PublicRoute";
import NotFoundRedirect from "@/components/layout/NotFoundRedirect";

// 페이지 컴포넌트 import
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";

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
    ],
  },
]);
