import {useState, useCallback, useEffect} from "react";
import {useForm} from "react-hook-form";
import {Link, useNavigate} from "react-router-dom";
import {useToast} from "../../contexts/useToast";
import {Input} from "@/components/common/Input";
import {authService} from "@/services/auth";
import AccountRecoveryModal from "@/components/auth/AccountRecoveryModal";
import type {LoginForm} from "@/types/auth";
import {authUtils} from "@/store/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const {showToast} = useToast();
  const [rememberMe, setRememberMe] = useState(false);
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
  } = useForm<LoginForm>();

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // 이메일 형식 검증 함수
  const validateEmail = (email: string) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  };

  // 이메일 값이 변경될 때마다 유효성 검사
  useEffect(() => {
    if (emailValue) {
      const isValid = validateEmail(emailValue);
      if (!isValid) {
        setEmailError("이메일 형식이 올바르지 않습니다");
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
  }, [emailValue]);

  // 비밀번호 입력 필드 변경 시 관련 에러 초기화
  useEffect(() => {
    setPasswordError(null);
  }, [passwordValue]);

  // 입력 값 변경 시 로그인 오류 초기화
  useEffect(() => {
    if (emailValue || passwordValue) {
      setLoginError(null);
    }
  }, [emailValue, passwordValue]);

  const isButtonActive = emailValue && validateEmail(emailValue) && passwordValue?.length > 0;

  const handleRecoveryModalConfirm = () => {
    setShowRecoveryModal(false);
    showToast("로그인이 완료되었습니다.", "success");
    navigate("/collections", {replace: true});
  };

  const onSubmit = useCallback(
    async (data: LoginForm) => {
      if (isLoading) return;

      // 에러 상태 초기화
      setLoginError(null);
      setEmailError(null);
      setPasswordError(null);
      setIsLoading(true);

      try {
        const response = await authService.login(data, rememberMe);
        localStorage.setItem("email", data.email);

        const currentUser = authUtils.getStoredUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            provider: "local" as const,
          };
          authUtils.setStoredUser(updatedUser);
        }

        if (response.recovered) {
          setShowRecoveryModal(true);
        } else {
          showToast("로그인이 완료되었습니다.", "success");
          navigate("/collections");
        }
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = error.message;

          // 에러 메시지 분류
          if (errorMessage.includes("이메일") || errorMessage.includes("등록되지 않은 계정")) {
            setEmailError(errorMessage);
          } else if (errorMessage.includes("비밀번호")) {
            setPasswordError(errorMessage);
          } else if (errorMessage.includes("계정 정보") || errorMessage.includes("회원가입")) {
            setLoginError(errorMessage);
          } else {
            setLoginError(errorMessage);
          }
        } else {
          setLoginError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, rememberMe, showToast, isLoading, loginError, emailError, passwordError]
  );

  return (
    <div className="min-h-screen flex max-h-screen overflow-hidden">
      <AccountRecoveryModal isOpen={showRecoveryModal} onConfirm={handleRecoveryModalConfirm} />

      {/* Left Section */}
      <div className="hidden lg:block lg:w-1/2 flex-shrink-0 overflow-hidden">
        <img src="/images/login-intro-bg.svg" alt="Smart Memo" className="w-full h-full object-cover" />
      </div>

      {/* Right Section */}
      <div className="flex-1 bg-[#f9faf9] flex items-center justify-center overflow-y-auto py-4">
        <div className="w-full max-w-[520px] px-4">
          <h2 className="text-center text-2xl font-bold text-primary mb-8 sm:mb-12">로그인</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">이메일</p>
                <Input
                  placeholder="abc@refhub.com"
                  {...register("email", {
                    required: "이메일을 입력해주세요",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "이메일 형식이 올바르지 않습니다",
                    },
                  })}
                  error={emailError || errors.email?.message}
                  className="h-12 sm:h-14"
                  emailOnly
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">비밀번호</p>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  {...register("password", {
                    required: "비밀번호를 입력해주세요",
                  })}
                  error={passwordError || errors.password?.message}
                  className="h-12 sm:h-14"
                  passwordOnly
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 checked:bg-primary checked:hover:bg-primary checked:focus:bg-primary"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-[#676967]">
                  자동 로그인
                </label>
              </div>
              <Link to="/auth/reset-password" className="text-sm text-[#676967] hover:text-primary transition-colors">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={!isButtonActive || isLoading}
                className={`
                  w-full h-12 sm:h-14 rounded-lg font-medium transition-colors duration-200
                  ${
                    isButtonActive && !isLoading
                      ? "bg-primary hover:bg-primary-dark text-white"
                      : "bg-[#8A8D8A] text-white cursor-not-allowed"
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    로그인 중...
                  </span>
                ) : (
                  "로그인"
                )}
              </button>
            </div>

            {loginError && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                <p className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {loginError}
                </p>
              </div>
            )}
          </form>

          <div className="text-center mt-4 sm:mt-6">
            <span className="text-[#676967] text-sm">계정이 없으신가요? </span>
            <Link to="/auth/signup" className="text-primary hover:text-primary-dark text-sm transition-colors">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
