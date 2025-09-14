// src/components/common/Input.tsx
import {
  forwardRef,
  useState,
  KeyboardEvent,
  useEffect,
  ChangeEvent,
} from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  isLoading?: boolean;
  isValid?: boolean;
  numbersOnly?: boolean;
  emailOnly?: boolean;
  nameOnly?: boolean;
  passwordOnly?: boolean;
  maxLength?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = "md",
      rightElement,
      leftElement,
      isLoading,
      isValid,
      numbersOnly,
      emailOnly,
      passwordOnly,
      nameOnly,
      type,
      disabled,
      className = "",
      onKeyPress,
      onChange,
      value,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputValue, setInputValue] = useState<string>(
      (value as string) || ""
    );

    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value as string);
      }
    }, [value]);

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2",
      lg: "px-4 py-3 text-lg",
    };

    const getBorderColor = () => {
      if (error)
        return "border-red-500 focus:border-red-500 focus:ring-red-500";
      if (isValid)
        return "border-green-500 focus:border-green-500 focus:ring-green-500";
      return "border-gray-300 focus:border-primary focus:ring-primary";
    };

    const baseInputStyles = `
    w-full
    rounded-lg
    bg-white
    border
    focus:outline-none
    focus:ring-2
    focus:ring-opacity-50
    disabled:bg-gray-50
    disabled:cursor-not-allowed
    transition-colors
    duration-200
    ${getBorderColor()}
    ${leftElement ? "pl-10" : ""}
    ${rightElement || type === "password" ? "pr-10" : ""}
    ${sizeStyles[size]}
    ${className}
  `;

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
      // 숫자만 입력 가능하도록 처리
      if (numbersOnly && !/[0-9]/.test(e.key)) {
        e.preventDefault();
      }

      onKeyPress?.(e);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // 각 필드 타입별 필터링 로직
      if (numbersOnly) {
        // 숫자만 허용
        newValue = newValue.replace(/[^0-9]/g, "");
      } else if (emailOnly) {
        // 이메일에 허용된 문자만 포함 (영문자, 숫자, @, ., _, -, +)
        newValue = newValue.replace(/[^\w@.+-]/g, "");
      } else if (passwordOnly) {
        // 비밀번호에 허용된 문자만 포함 (영문자, 숫자, 특수문자)
        newValue = newValue.replace(/[^\x20-\x7E]/g, ""); // ASCII 범위의 출력 가능한 문자만 허용
      } else if (nameOnly) {
        // 이름에 허용된 문자만 포함 (한글, 영문)
        // 한글의 경우 조합 중인 글자도 허용하기 위해 정규식 확장
        newValue = newValue.replace(/[^A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
      }

      // maxLength 적용
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      // DOM 요소의 value 직접 업데이트
      e.target.value = newValue;
      setInputValue(newValue);

      // 원래의 onChange 핸들러 호출
      onChange?.(e);
    };

    const renderPasswordToggle = type === "password" && (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    );

    const inputType =
      type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            value={inputValue}
            disabled={disabled || isLoading}
            className={baseInputStyles}
            onKeyPress={handleKeyPress}
            onChange={handleChange}
            {...props}
          />
          {renderPasswordToggle ||
            (rightElement && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {rightElement}
              </div>
            ))}
        </div>
        {(error || helperText) && (
          <p
            className={`text-sm mt-1 ${
              error ? "text-red-500" : "text-gray-500"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
