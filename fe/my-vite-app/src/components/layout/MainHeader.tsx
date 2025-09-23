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
                  alt="SmartMemo"
                  className="h-8"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
