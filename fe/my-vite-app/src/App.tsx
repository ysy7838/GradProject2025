// src/App.tsx
import {RouterProvider} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {RecoilRoot} from "recoil";
import {router} from "./router";
import {AuthProvider} from "@/components/layout/AuthProvider";
import {ToastProvider} from "@/contexts/ToastProvider";
import {useEffect} from "react";
import {useToast} from "@/contexts/useToast";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// AppContent 컴포넌트 추가 - ToastProvider 내부에서 useToast 사용
function AppContent() {
  const {showToast} = useToast();

  useEffect(() => {
    // 인증 오류 이벤트 리스너
    const handleAuthError = (event: CustomEvent<{message: string}>) => {
      showToast(event.detail.message, "error");
    };

    // 이벤트 리스너 등록
    window.addEventListener("auth-error", handleAuthError as EventListener);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("auth-error", handleAuthError as EventListener);
    };
  }, [showToast]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App;
