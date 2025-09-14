// src/components/reference/KeywordInput.tsx
import React, { useState, useRef } from "react";
import { X } from "lucide-react";

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  maxLength?: number;
  disabled?: boolean; // 추가
}

export default function KeywordInput({
  keywords,
  onChange,
  maxKeywords = 10,
  maxLength = 15,
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && inputValue.trim()) {
      e.preventDefault();
      if (keywords.length >= maxKeywords) {
        return;
      }

      const newKeyword = inputValue.trim();
      if (newKeyword.length > maxLength) {
        return;
      }

      onChange([...keywords, newKeyword]);
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove));
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {keywords.map((keyword, index) => (
        <div
          key={index}
          className="flex items-center bg-[#0A306C] text-white px-[10px] py-1 rounded gap-[10px] h-[27px] text-sm"
        >
          <span>{keyword}</span>
          <button
            type="button"
            onClick={() => handleRemoveKeyword(index)}
            className="hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={keywords.length === 0 ? "예) 코드잇 개발 기획" : ""}
        className="flex-1 min-w-[200px] outline-none bg-transparent placeholder-gray-400"
        maxLength={maxLength}
        disabled={keywords.length >= maxKeywords}
      />
    </div>
  );
}
