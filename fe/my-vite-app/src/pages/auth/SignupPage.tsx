// src/pages/auth/SignupPage.tsx
import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {Link, useNavigate} from "react-router-dom"; // Assuming react-router-dom is used
import {Input} from "@/components/common/Input";
import {Button} from "@/components/common/Button";
import {useToast} from "@/contexts/useToast";
import {authService} from "@/services/auth";
import type {SignupForm} from "@/types/auth";

// Type definition for the steps in the signup process
type SignupStep = "EMAIL" | "VERIFY" | "PASSWORD";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>("EMAIL");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const {showToast} = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: {errors},
    watch,
    trigger,
    getValues,
  } = useForm<SignupForm>({
    mode: "onChange",
  });

  // Effect for the countdown timer
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Watch form fields
  const email = watch("email");
  const verificationCode = watch("verificationCode");
  const password = watch("password");
  const passwordConfirm = watch("passwordConfirm");

  // Clear verification error when the code input changes
  useEffect(() => {
    if (verificationCode) {
      setVerificationError(null);
    }
  }, [verificationCode]);

  // Validation status for each step to control button state
  const isEmailStepValid = email && !errors.email;
  const isVerificationStepValid = verificationCode?.length === 6 && !errors.verificationCode;
  const isPasswordStepValid = password && !errors.password && passwordConfirm && !errors.passwordConfirm;

  // Password validation logic
  const validatePassword = (value: string) => {
    if (!value) return "비밀번호를 입력해주세요.";
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isValidLength = value.length >= 8 && value.length <= 12;

    const validConditions = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;

    if (!isValidLength || validConditions < 2) {
      return "영문, 숫자, 특수문자 중 2가지 이상 조합하여 8-12자로 입력해주세요.";
    }
    return true;
  };

  // Handler to send the verification code
  const handleVerificationSend = async () => {
    const isValid = await trigger(["email"]);
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      await authService.sendVerificationCode(getValues("email"));
      showToast("인증번호가 발송되었습니다.", "success");
      setCurrentStep("VERIFY");
      setCountdown(300); // 10 minutes
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "인증번호 전송에 실패했습니다.";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to verify the code
  const handleVerifyCode = async () => {
    const isValid = await trigger("verificationCode");
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setVerificationError(null);
    try {
      await authService.verifyCode({
        email: getValues("email"),
        verificationCode: getValues("verificationCode"),
      });
      showToast("인증이 완료되었습니다.", "success");
      setCurrentStep("PASSWORD");
    } catch (error) {
      setVerificationError("인증번호가 일치하지 않습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the final form submission
  const onSubmit = async (data: SignupForm) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await authService.signup(data);
      showToast("회원가입이 완료되었습니다. 로그인해주세요.", "success");
      navigate("/auth/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case "VERIFY":
        return (
          <div className="space-y-4">
            <Input label="이메일" value={getValues("email")} disabled className="bg-gray-200 text-gray-500" />
            <div className="relative">
              <Input
                placeholder="인증번호 6자리를 입력해주세요"
                maxLength={6}
                numbersOnly
                {...register("verificationCode", {
                  required: "인증번호를 입력해주세요.",
                  minLength: {value: 6, message: "6자리 숫자를 입력해주세요."},
                })}
                error={errors.verificationCode?.message || verificationError || undefined}
              />
              {countdown > 0 && (
                <span className="absolute top-1/2 -translate-y-1/2 right-4 text-sm text-gray-500">{`${String(
                  Math.floor(countdown / 60)
                ).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`}</span>
              )}
            </div>
            <div className="pt-4">
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={!isVerificationStepValid || isLoading}
                fullWidth
              >
                {isLoading ? "확인 중..." : "다음"}
              </Button>
            </div>
          </div>
        );
      case "PASSWORD":
        return (
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              helperText="영문, 숫자, 특수문자 중 2가지 이상 조합 (8-12자)"
              {...register("password", {validate: validatePassword})}
              error={errors.password?.message}
              isValid={!!password && !errors.password}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              {...register("passwordConfirm", {
                required: "비밀번호를 다시 입력해주세요.",
                validate: (value) => value === password || "비밀번호가 일치하지 않습니다.",
              })}
              error={errors.passwordConfirm?.message}
              isValid={!!passwordConfirm && !errors.passwordConfirm}
              autoComplete="new-password"
            />
            <div className="pt-4">
              <Button type="submit" disabled={!isPasswordStepValid || isLoading} fullWidth>
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>
            </div>
          </div>
        );
      case "EMAIL":
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Input
                placeholder="예시: abc@gmail.com"
                className="flex-1"
                {...register("email", {
                  required: "이메일을 입력해주세요",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "이메일 형식이 올바르지 않습니다",
                  },
                })}
                error={errors.email?.message}
              />
              <Button
                type="button"
                onClick={handleVerificationSend}
                disabled={!isEmailStepValid || isLoading}
                className="w-auto px-4 whitespace-nowrap !h-12"
              >
                {isLoading ? "전송 중..." : "인증하기"}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-gradient-100 to-gradient-0">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h2 className="typo-h1 text-gray-900">회원가입</h2>
          <p className="text-sm text-gray-500 mt-2">
            {currentStep === "EMAIL" && "서비스 이용을 위해 정보를 입력해주세요."}
            {currentStep === "VERIFY" && "이메일로 전송된 인증번호를 입력해주세요."}
            {currentStep === "PASSWORD" && "마지막 단계입니다. 비밀번호를 설정해주세요."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>{renderStep()}</form>
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
          <Link to="/auth/login" className="font-semibold text-primary-100 hover:text-primary-200 transition-colors">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}