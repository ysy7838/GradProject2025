import {useState, useCallback, useEffect} from "react";
import {useForm} from "react-hook-form";
import {Link, useNavigate} from "react-router-dom";
import {Loader2} from "lucide-react";
import axios from "axios";

import {useToast} from "@/contexts/useToast";
import {Input} from "@/components/common/Input";
import {Button} from "@/components/common/Button";
import {authService} from "@/services/auth";
import AccountRecoveryModal from "@/components/auth/AccountRecoveryModal";
import type {LoginForm} from "@/types/auth";
import {authUtils} from "@/store/auth";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg
    className="mr-2 -ml-1 w-4 h-4"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C322 104 286.6 88 248 88c-88.3 0-160 71.7-160 160s71.7 160 160 160c92.6 0 145.5-68.2 149.9-105.5H248V280h236.1c2.3 12.7 3.9 26.1 3.9 40.2z"
    ></path>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const {showToast} = useToast();
  const [rememberMe, setRememberMe] = useState(false); // 👈 자동 로그인 상태 추가
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: {errors},
  } = useForm<LoginForm>({mode: "onChange"});

  const emailValue = watch("email");
  const passwordValue = watch("password");

  const validateEmail = (email: string) => {
    if (!email) return false;
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  };

  useEffect(() => {
    if (emailValue) {
      const isValid = validateEmail(emailValue);
      setEmailError(isValid ? null : "이메일 형식이 올바르지 않습니다");
    } else {
      setEmailError(null);
    }
  }, [emailValue]);

  useEffect(() => {
    if (passwordValue) setPasswordError(null);
  }, [passwordValue]);

  useEffect(() => {
    if (emailValue || passwordValue) setLoginError(null);
  }, [emailValue, passwordValue]);

  const isButtonActive = validateEmail(emailValue) && passwordValue && !emailError && !errors.password;

  const handleRecoveryModalConfirm = () => {
    setShowRecoveryModal(false);
    showToast("로그인이 완료되었습니다.", "success");
    navigate("/categories", {replace: true});
  };

  const onSubmit = useCallback(
    async (data: LoginForm) => {
      if (isLoading) return;
      setIsLoading(true);
      setLoginError(null);
      setEmailError(null);
      setPasswordError(null);

      try {
        const response = await authService.login(data, rememberMe); // 👈 rememberMe 상태 전달
        localStorage.setItem("email", data.email);
        const currentUser = authUtils.getStoredUser();
        if (currentUser) {
          authUtils.setStoredUser({...currentUser, provider: "local" as const});
        }

        if (response.recovered) {
          setShowRecoveryModal(true);
        } else {
          showToast("로그인이 완료되었습니다.", "success");
          navigate("/categories");
        }
      } catch (error) {
        // 👇 에러 메시지를 상세하게 보여주도록 로직 수정
        if (axios.isAxiosError(error) && error.response) {
          const message = error.response.data?.message || "로그인에 실패했습니다.";
          if (message.includes("이메일") || message.includes("등록되지 않은")) {
            setEmailError(message);
          } else if (message.includes("비밀번호")) {
            setPasswordError(message);
          } else {
            setLoginError(message);
          }
        } else if (error instanceof Error) {
          // 네트워크 오류 등 서버 응답이 없는 경우
          setLoginError(error.message);
        } else {
          // 그 외 알 수 없는 오류
          setLoginError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, showToast, isLoading, rememberMe]
  );

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-gradient-100 to-gradient-0">
      <AccountRecoveryModal isOpen={showRecoveryModal} onConfirm={handleRecoveryModalConfirm} />

      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h2 className="typo-h1 text-gray-900">계정에 로그인해주세요</h2>
          <p className="text-sm text-gray-500 mt-2">이메일과 비밀번호를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="예시: abc@gmail.com"
            {...register("email")}
            error={emailError || errors.email?.message}
            disabled={isLoading}
            emailOnly
          />

          <Input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            {...register("password")}
            error={passwordError || errors.password?.message}
            autoComplete="current-password"
            disabled={isLoading}
            passwordOnly
          />

          {loginError && <p className="typo-caption3 text-danger text-center">{loginError}</p>}

          {/* 자동 로그인 및 비밀번호 찾기 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="remember-me" className="ml-2 block typo-caption2 font-medium text-gray-500">
                자동 로그인
              </label>
            </div>
            <Link
              to="/auth/reset-password"
              className="typo-caption2 font-medium text-gray-500 hover:text-primary transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <div className="pt-4 space-y-3">
            <Button type="submit" disabled={!isButtonActive || isLoading} isLoading={isLoading} fullWidth>
              로그인
            </Button>
            {<Button type="button" variant="outline" fullWidth={true} leftIcon={<GoogleIcon />}>
              구글로 계속하기
            </Button>}
          </div>
        </form>

        <div className="text-center mt-6">
          <span className="typo-caption2 text-gray-500">계정이 없으신가요? </span>
          <Link
            to="/auth/signup"
            className="typo-caption2 font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}
