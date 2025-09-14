//src/components/common/Dropdown.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { useRecoilState, useRecoilValue } from "recoil";
import { DropState, collectionState } from "@/store/collection";

interface Option {
  en?: string;
  ko: string;
  check?: boolean;
}

interface DropdownProps {
  type: "array" | "searchType" | "collection";
}

const Dropdown: React.FC<DropdownProps> = ({ type }) => {
  const options: Record<string, Option[]> = {
    array: [
      // 레퍼런스 정렬
      { en: "latest", ko: "최신순" },
      { en: "oldest", ko: "오래된순" },
      { en: "sortAsc", ko: "오름차순" },
      { en: "sortDesc", ko: "내림차순" },
    ],
    searchType: [
      // 검색타입
      { en: "all", ko: "전체 검색" },
      { en: "title", ko: "제목" },
      { en: "keyword", ko: "키워드" },
    ],
    collection: [{ check: false, ko: "전체" }],
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useRecoilState(DropState);
  const collectionData = useRecoilValue(collectionState)?.data ?? [];
  const titles = collectionData.map((item) => ({
    ko: item.title,
  }));
  const [total, setTotal] = useState({ check: false, ko: "전체" });
  const [selectedOption, setSelectedOption] = useState(options[type][0].ko);

  useEffect(() => {
    if (type === "array") {
      setSelectedOption(
        options["array"].find((el) => el.en === sort.sortType)?.ko || "최신순"
      );
    }

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

  useEffect(() => {
    titles.length === sort.collections.length
      ? setTotal((prev) => ({ ...prev, check: true }))
      : setTotal((prev) => ({ ...prev, check: false }));
  }, [sort.collections]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: Option) => {
    if (type === "collection") {
      if (option.ko === "전체") {
        if (total.check) {
          setSort((prev) => ({ ...prev, collections: [] }));
          setTotal((prev) => ({ ...prev, check: false }));
        } else {
          setSort((prev) => ({
            ...prev,
            collections: titles.map((item) => item.ko),
          }));
          setTotal((prev) => ({ ...prev, check: true }));
        }
      } else {
        setSort((prev) => ({
          ...prev,
          collections: prev.collections.includes(option.ko)
            ? prev.collections.filter((i) => i !== option.ko)
            : [...prev.collections, option.ko],
        }));
      }
    } else if (type === "array") {
      setSort((prev) => ({ ...prev, sortType: option.en || "latest" }));
      setSelectedOption(option.ko);
      setIsOpen(false);
    } else {
      setSort((prev) => ({ ...prev, searchType: option.en || "all" }));
      setSelectedOption(option.ko);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative text-base" ref={dropdownRef}>
      <div
        className={`flex items-center gap-2 pl-5 pr-4 py-[13px] cursor-pointer text-gray-700 font-normal`}
        onClick={toggleDropdown}
        tabIndex={0}
      >
        {type === "collection" ? `컬렉션` : selectedOption}
        {isOpen ? (
          <ChevronUp className="w-6 h-6 stroke-gray-700" />
        ) : (
          <ChevronDown className="w-6 h-6 stroke-gray-700" />
        )}
      </div>
      {isOpen && type !== "collection" && (
        <ul className="flex flex-col absolute w-full bg-white p-4 gap-4 border border-gray-200 rounded-lg shadow-[0px_0px_10px_0px_rgba(181,184,181,0.20)] z-10">
          {options[type].map((option, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-gray-700 text-base font-nomal cursor-pointer hover:text-primary hover:font-semibold"
              onClick={() => handleSelect(option)}
            >
              {option.ko}
            </li>
          ))}
        </ul>
      )}

      {isOpen && type === "collection" && (
        <ul className="flex flex-col absolute max-w-60 max-h-96 overflow-y-auto bg-white p-4 gap-4 border border-gray-200 rounded-lg shadow-[0px_0px_10px_0px_rgba(181,184,181,0.20)] z-10">
          <li
            className="flex items-center gap-2 cursor-pointer hover:text-primary hover:font-semibold"
            onClick={() => handleSelect(total)}
          >
            <div className="relative w-5 h-5 min-w-5 border-2 border-primary rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out">
              {total.check && (
                <Check className="w-5 h-5 text-white bg-primary rounded-md" />
              )}
            </div>
            <p className="text-gray-700 text-base font-nomal truncate">
              {total.ko}
            </p>
          </li>
          {titles.map((option, index) => (
            <li
              key={index}
              className="flex items-center gap-2 cursor-pointer hover:text-primary hover:font-semibold"
              onClick={() => handleSelect(option)}
            >
              <div className="relative w-5 h-5 min-w-5 border-2 border-primary rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out">
                {sort.collections.some((item) => item === option.ko) && (
                  <Check className="w-5 h-5 text-white bg-primary rounded-md" />
                )}
              </div>
              <p className="text-gray-700 text-base font-nomal truncate">
                {option.ko}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
