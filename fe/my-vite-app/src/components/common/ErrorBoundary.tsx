// src/components/common/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '@/store/auth';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isAuthenticated = authUtils.getToken();
      
      // 인증 상태에 따라 적절한 페이지로 리다이렉트
      return isAuthenticated 
        ? <Navigate to="/collections" replace />
        : <Navigate to="/auth/login" replace />;
    }

    return this.props.children;
  }
}