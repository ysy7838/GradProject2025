// src/pages/auth/SignupPage.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/useToast";
import { authService } from "@/services/auth";
import type { SignupForm } from "@/types/auth";

type SignupStep = "INFO" | "VERIFY" | "PASSWORD";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>("INFO");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Add new state for verification error
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    clearErrors,
    getValues,
  } = useForm<SignupForm>({
    mode: "onChange",
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const email = watch("email");
  const verificationCode = watch("verificationCode");
  const password = watch("password");
  const passwordConfirm = watch("passwordConfirm");

  // Clear verification error when code changes
  useEffect(() => {
    if (verificationError) {
      setVerificationError(null);
    }
  }, [verificationCode]);

  const isEmailValid = email && !errors.email;
  const isVerificationComplete =
    verificationCode?.length === 6 &&
    !errors.verificationCode &&
    !verificationError;
  const isPasswordValid =
    password && passwordConfirm && !errors.password && !errors.passwordConfirm;

  // 비밀번호 유효성 검사 함수
  const validatePassword = (value: string) => {
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const validLength = value.length >= 8 && value.length <= 12;

    if (!value) return "비밀번호를 입력해주세요";

    const validCombination =
      (hasLetter && hasNumber) ||
      (hasLetter && hasSpecial) ||
      (hasNumber && hasSpecial);

    if (!validLength || !validCombination) {
      return "영문, 숫자, 특수문자 중 2종류 이상 조합 (8-12자)";
    }

    return true;
  };

  const handleVerificationSend = async () => {
    const isValid = await trigger(["name", "email"]);
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      const { name, email } = getValues();
      await authService.sendVerificationCode(name, email);
      setVerificationSent(true);
      setCountdown(600); // 10분
      clearErrors("verificationCode");
      setVerificationError(null); // Clear any existing verification errors
      showToast("인증번호가 발송되었습니다.", "success");
    } catch (error) {
      if (error instanceof Error) {
        // 서버에서 보내는 메시지를 그대로 사용
        showToast(error.message, "error");
      } else {
        // 알 수 없는 형태의 오류일 경우 기본 메시지 사용
        showToast("인증번호 전송에 실패했습니다.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const isValid = await trigger("verificationCode");
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      await authService.verifyCode({
        email: getValues("email"),
        verificationCode: getValues("verificationCode"),
      });

      setIsVerified(true);
      setVerificationError(null); // Clear any errors on success
      setCurrentStep("PASSWORD");
      showToast("인증이 완료되었습니다.", "success");
    } catch (error) {
      if (error instanceof Error) {
        // Set error message instead of showing toast
        setVerificationError("인증번호가 일치하지 않습니다.");
      } else {
        setVerificationError("인증에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupForm) => {
    if (isLoading || !isVerified) return;

    setIsLoading(true);
    try {
      await authService.signup(data);
      showToast("회원가입이 완료되었습니다. 로그인해주세요.", "success");
      navigate("/auth/login");
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("회원가입에 실패했습니다.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 mt-16">
      <div className="w-[520px]">
        <h2 className="text-[32px] text-center font-bold text-primary mb-8">
          회원가입
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* 이름 입력 필드 */}
            <Input
              label="이름"
              placeholder="이름을 입력하세요"
              className="w-full h-[56px]"
              nameOnly
              maxLength={10}
              {...register("name", {
                required: "이름을 입력해주세요",
                pattern: {
                  value: /^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]+$/, // 한글 자음/모음 추가
                  message: "한글 또는 영문만 입력 가능합니다",
                },
                maxLength: {
                  value: 10,
                  message: "최대 10글자까지 입력 가능합니다",
                },
              })}
              error={errors.name?.message}
              disabled={verificationSent}
            />

            {/* 이메일 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                이메일
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="abc@refhub.com"
                    className="w-[379px] h-[56px]"
                    {...register("email", {
                      required: "이메일을 입력해주세요",
                      pattern: {
                        value:
                          /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i,
                        message: "이메일 형식이 올바르지 않습니다",
                      },
                    })}
                    error={errors.email?.message}
                    disabled={verificationSent}
                    emailOnly
                  />
                </div>
                <Button
                  type="button"
                  variant={
                    isVerified
                      ? "primary"
                      : countdown > 0
                      ? "secondary"
                      : "primary"
                  }
                  onClick={handleVerificationSend}
                  disabled={!isEmailValid || isVerified || countdown > 0}
                  className="w-[136px] h-[56px] text-base font-medium whitespace-nowrap"
                >
                  {isVerified
                    ? "인증 완료"
                    : isLoading
                    ? "전송 중..."
                    : countdown > 0
                    ? `${Math.floor(countdown / 60)}:${String(
                        countdown % 60
                      ).padStart(2, "0")}`
                    : "인증번호 전송"}
                </Button>
              </div>
            </div>

            {/* 인증번호 입력 필드 */}
            {verificationSent && currentStep !== "PASSWORD" && (
              <div className="space-y-4">
                <Input
                  label="인증번호"
                  placeholder="인증번호 6자리를 입력하세요"
                  className="w-full h-[56px]"
                  maxLength={6}
                  numbersOnly
                  {...register("verificationCode", {
                    required: "인증번호를 입력해주세요",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "인증번호는 6자리 숫자입니다",
                    },
                  })}
                  error={verificationError || errors.verificationCode?.message}
                />
                <Button
                  type="button"
                  variant={isVerificationComplete ? "primary" : "secondary"}
                  onClick={handleVerifyCode}
                  disabled={!isVerificationComplete || isLoading}
                  className="w-full h-[56px]"
                >
                  {isLoading ? "확인 중..." : "다음"}
                </Button>
              </div>
            )}

            {/* 비밀번호 입력 필드 */}
            {currentStep === "PASSWORD" && (
              <div className="space-y-4">
                <Input
                  label="비밀번호"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="w-full h-[56px]"
                  passwordOnly
                  autoComplete="new-password"
                  {...register("password", {
                    required: "비밀번호를 입력해주세요",
                    validate: validatePassword,
                  })}
                  error={errors.password?.message}
                  helperText="영문, 숫자, 특수문자 중 2종류 이상 조합 (8-12자)"
                  isValid={Boolean(password && !errors.password)}
                />
                <Input
                  label="비밀번호 재입력"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full h-[56px]"
                  passwordOnly
                  autoComplete="new-password"
                  {...register("passwordConfirm", {
                    required: "비밀번호 확인을 입력해주세요",
                    validate: (value) =>
                      value === password || "비밀번호가 일치하지 않습니다",
                  })}
                  error={errors.passwordConfirm?.message}
                  isValid={Boolean(passwordConfirm && !errors.passwordConfirm)}
                />
                <Button
                  type="submit"
                  variant={isPasswordValid ? "primary" : "secondary"}
                  className="w-full h-[56px]"
                  disabled={!isPasswordValid || isLoading}
                >
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
