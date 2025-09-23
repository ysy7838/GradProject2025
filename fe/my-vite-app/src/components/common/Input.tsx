import {forwardRef, useState, KeyboardEvent, useEffect, ChangeEvent} from "react";
import {Eye, EyeOff} from "lucide-react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
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
    const [inputValue, setInputValue] = useState<string>((value as string) || "");

    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value as string);
      }
    }, [value]);

    const sizeStyles = {
      sm: "h-10 px-3 text-sm",
      md: "h-12 px-4 text-base", // 기본 input 크기를 디자인에 맞게 조정
      lg: "h-14 px-5 text-lg",
    };

    // 테두리 색상을 tailwind.config.ts에 정의된 색상으로 변경합니다.
    const getBorderColor = () => {
      if (error) return "border-danger focus:border-danger focus:ring-danger/50";
      // isValid 상태일 때 primary 색상을 사용해 통일성을 줍니다.
      if (isValid) return "border-primary focus:border-primary focus:ring-primary/50";
      return "border-gray-300 focus:border-primary focus:ring-primary/50";
    };

    const baseInputStyles = `
      w-full
      rounded-lg
      bg-white
      border
      text-gray-900
      placeholder-gray-500
      focus:outline-none
      focus:ring-2
      disabled:bg-gray-100
      disabled:cursor-not-allowed
      transition-colors
      duration-200
      ${getBorderColor()}
      ${leftElement ? "pl-10" : ""}
      ${rightElement || type === "password" ? "pr-10" : ""}
      ${sizeStyles[size]}
      ${className}
      shadow-md
    `;

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
      if (numbersOnly && !/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
      onKeyPress?.(e);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      if (numbersOnly) {
        newValue = newValue.replace(/[^0-9]/g, "");
      } else if (emailOnly) {
        newValue = newValue.replace(/[^\w@.+-]/g, "");
      } else if (passwordOnly) {
        newValue = newValue.replace(/[^\x20-\x7E]/g, "");
      } else if (nameOnly) {
        newValue = newValue.replace(/[^A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
      }

      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      e.target.value = newValue;
      setInputValue(newValue);
      onChange?.(e);
    };

    const renderPasswordToggle = type === "password" && (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    );

    const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
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
            (rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>)}
        </div>
        {(error || helperText) && (
          <p className={`text-xs mt-1.5 ${error ? "text-danger" : "text-gray-500"}`}>{error || helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
