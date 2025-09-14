// src/components/common/CollectionDropdown.tsx
import React, { useState, useRef, useEffect } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

interface CollectionOption {
  _id: string;
  title: string;
  isFavorite: boolean;
  viewer?: boolean;
}

interface CollectionDropdownProps {
  options: CollectionOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CollectionDropdown: React.FC<CollectionDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "선택해주세요",
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 선택된 옵션의 정보 찾기
  const selectedOption = options.find((option) => option._id === value);

  // 옵션을 즐겨찾기와 일반으로 분리
  const favoriteOptions = options.filter(
    (option) => option.isFavorite && !option.viewer
  );
  const regularOptions = options.filter(
    (option) => !option.isFavorite && !option.viewer
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* 드롭다운 헤더 */}
      <div
        className={`flex items-center justify-between w-full h-[56px] px-4 border border-gray-300 rounded-lg appearance-none bg-white hover:border-primary transition-colors ${
          disabled
            ? "bg-gray-100 cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {selectedOption?.isFavorite && (
            <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
          )}
          <span className={`${!value ? "text-gray-400" : "text-gray-700"}`}>
            {selectedOption?.title || placeholder}
          </span>
        </div>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 드롭다운 옵션 */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              옵션이 없습니다
            </div>
          ) : (
            <div className="py-1">
              {/* 즐겨찾기 그룹 */}
              {favoriteOptions.length > 0 && (
                <>
                  {favoriteOptions.map((option) => (
                    <div
                      key={option._id}
                      className={`flex items-center px-4 py-3 text-sm ${
                        option._id === value
                          ? "bg-primary-light text-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } cursor-pointer`}
                      onClick={() => {
                        onChange(option._id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{option.title}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 일반 그룹 */}
              {regularOptions.length > 0 && (
                <>
                  {regularOptions.map((option) => (
                    <div
                      key={option._id}
                      className={`flex items-center px-4 py-3 text-sm ${
                        option._id === value
                          ? "bg-primary-light text-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      } cursor-pointer`}
                      onClick={() => {
                        onChange(option._id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center w-full">
                        <span>{option.title}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionDropdown;
