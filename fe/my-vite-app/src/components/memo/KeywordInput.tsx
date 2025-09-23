import React, {useState, useRef, useEffect} from "react";
import {X, Plus} from "lucide-react";

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  maxLength?: number;
  disabled?: boolean;
}

export default function KeywordInput({
  keywords,
  onChange,
  maxKeywords = 10,
  maxLength = 15,
  disabled = false,
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addKeyword = () => {
    const newKeyword = inputValue.trim();
    if (newKeyword && keywords.length < maxKeywords && !keywords.includes(newKeyword)) {
      onChange([...keywords, newKeyword]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove));
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 border rounded-lg" onClick={() => inputRef.current?.focus()}>
      <div className="flex flex-wrap gap-2 items-center">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full gap-1.5 text-sm font-medium"
          >
            <span>{keyword}</span>
            <button
              type="button"
              onClick={() => handleRemoveKeyword(index)}
              className="text-gray-400 hover:text-gray-800"
              disabled={disabled}
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
          placeholder="태그 추가"
          className="flex-1 min-w-[100px] h-7 bg-transparent outline-none placeholder-gray-400 text-sm"
          maxLength={maxLength}
          disabled={disabled || keywords.length >= maxKeywords}
        />

        <button
          type="button"
          onClick={addKeyword}
          className="flex items-center text-gray-500 hover:text-primary"
          disabled={disabled}
        >
          <Plus size={16} className="mr-1" />
          <span className="text-sm font-medium">추가하기</span>
        </button>
      </div>
    </div>
  );
}
