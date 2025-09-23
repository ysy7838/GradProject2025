import {forwardRef} from "react";
import {Loader2} from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 'disabled' variant를 추가하여 스타일을 명시적으로 제어합니다.
  variant?: "primary" | "outline" | "danger" | "disabled";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 shadow-md";

    const sizeStyles = {
      sm: "h-10 px-3 text-sm",
      md: "h-12 px-4 text-base", // 기본 버튼 크기를 디자인에 맞게 조정
      lg: "h-14 px-6 text-lg",
    };

    // tailwind.config.ts에 정의된 색상을 사용하도록 variant 스타일을 업데이트합니다.
    const getVariantStyles = () => {
      // disabled prop이 true이면 항상 disabled 스타일을 반환합니다.
      if (disabled || isLoading) {
        return "bg-gray-300 text-white cursor-not-allowed";
      }
      switch (variant) {
        case "primary":
          return "bg-primary text-white hover:bg-primary-dark";
        case "outline":
          return "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50";
        case "danger":
          return "bg-danger text-white hover:bg-red-600";
        case "disabled": // variant로 disabled를 명시적으로 사용할 경우
          return "bg-gray-300 text-white cursor-not-allowed";
        default:
          return "bg-primary text-white hover:bg-primary-dark";
      }
    };

    return (
      <button
        ref={ref}
        className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${getVariantStyles()}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
