// src/components/layout/MainHeader.tsx
import { Link, useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import SearchBar from "../common/SearchBar";
import { DropState } from "@/store/collection";
import ProfileDropdown from "../common/ProfileDropdown";

interface MainHeaderProps {
  shouldShowSearchBar: boolean;
}

export default function MainHeader({ shouldShowSearchBar }: MainHeaderProps) {
  const location = useLocation();
  const [, setSort] = useRecoilState(DropState);

  const getCurrentType = () => {
    if (location.pathname.includes("/collections")) return "collection";
    if (location.pathname.includes("/references")) return "reference";
    return "collection";
  };

  const handleReset = () => {
    setSort({
      sortType: "latest",
      searchType: "all",
      searchWord: "",
      collections: [],
    });
  };

  return (
    <header className="bg-white dark:bg-dark-bg shadow-sm rounded-bl-[48px] rounded-br-[48px] shadow-[0px_4px_10px_0px_rgba(181,184,181,0.10)] dark:shadow-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* PC 버전 헤더 */}
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center h-16 mt-4">
            {/* 로고 */}
            <div className="flex-1">
              <Link to="/" className="flex items-center" onClick={handleReset}>
                <img
                  src="/images/icon_with_text.svg"
                  alt="RefHub"
                  className="h-8"
                />
              </Link>
            </div>

            {/* 네비게이션 */}
            <div className="flex-1 flex justify-center space-x-8">
              <Link
                to="/collections"
                className={`text-xl whitespace-nowrap ${
                  getCurrentType() === "collection"
                    ? "text-primary dark:text-primary font-bold"
                    : "text-gray-600 dark:text-gray-300 font-medium"
                }`}
                onClick={handleReset}
              >
                나의 컬렉션
              </Link>
              <Link
                to="/references"
                className={`text-xl whitespace-nowrap ${
                  getCurrentType() === "reference"
                    ? "text-primary dark:text-primary font-bold"
                    : "text-gray-600 dark:text-gray-300 font-medium"
                }`}
                onClick={handleReset}
              >
                전체 레퍼런스
              </Link>
            </div>

            {/* 프로필 드롭다운 */}
            <div className="flex-1 flex justify-end">
              <ProfileDropdown />
            </div>
          </div>
        </div>

        {/* 모바일 버전 레이아웃 */}
        <div className="flex flex-col sm:hidden">
          {/* 로고와 버튼 */}
          <div className="flex justify-between items-center w-full pt-4">
            <Link to="/" className="flex items-center" onClick={handleReset}>
              <img
                src="/images/icon_with_text.svg"
                alt="RefHub"
                className="h-8"
              />
            </Link>

            {/* 모바일 전용: 프로필 드롭다운 */}
            <div className="flex items-center">
              <ProfileDropdown />
            </div>
          </div>

          {/* 모바일 전용: 하단 네비게이션 */}
          <nav className="flex justify-center space-x-8 mt-4 mb-2">
            <Link
              to="/collections"
              className={`text-xl whitespace-nowrap ${
                getCurrentType() === "collection"
                  ? "text-primary dark:text-primary font-bold"
                  : "text-gray-600 dark:text-gray-300 font-medium"
              }`}
              onClick={handleReset}
            >
              나의 컬렉션
            </Link>
            <Link
              to="/references"
              className={`text-xl whitespace-nowrap ${
                getCurrentType() === "reference"
                  ? "text-primary dark:text-primary font-bold"
                  : "text-gray-600 dark:text-gray-300 font-medium"
              }`}
              onClick={handleReset}
            >
              전체 레퍼런스
            </Link>
          </nav>
        </div>

        {/* SearchBar 컴포넌트 - 조건부 렌더링 */}
        {shouldShowSearchBar && (
          <div className="mt-2 sm:mt-0">
            <SearchBar type={getCurrentType()} />
          </div>
        )}
      </div>
    </header>
  );
}
