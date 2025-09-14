import { Navigate } from "react-router-dom";

const NotFoundRedirect = () => {
  // 인증 여부 확인
  const token = localStorage.getItem("accessToken");
  return token ? (
    <Navigate to="/collections" replace />
  ) : (
    <Navigate to="/auth/login" replace />
  );
};

export default NotFoundRedirect;
