//src/components/common/SearchBar.tsx
import { useState, useEffect, useRef } from "react";
import { Search, X, CircleX } from "lucide-react";
import Dropdown from "./Dropdown";
import { useRecoilState } from "recoil";
import { DropState } from "@/store/collection";

interface SearchProps {
  type: string;
}

const SearchBar: React.FC<SearchProps> = ({ type }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useRecoilState(DropState);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (sort.searchWord.length === 0) setSearch("");
  }, [sort]);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    let totalWidth = 0;
    let lastVisibleIndex = sort.collections.length;

    for (let i = 0; i < sort.collections.length; i++) {
      const tagWidth = tagRefs.current[i]?.offsetWidth || 110;
      totalWidth += tagWidth + 8;

      const moreWidth = moreRef.current?.offsetWidth || 74;
      if (totalWidth + moreWidth > containerWidth) {
        lastVisibleIndex = i;
        break;
      }
    }
    setVisibleCount(lastVisibleIndex);
  }, [sort.collections]);

  const handleSearch = (search: string) => {
    setSort((prev) => ({ ...prev, searchWord: search }));
  };

  const handleReset = () => {
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(search);
    }
  };

  return (
    <div>
      <div className="flex items-center sm:gap-6 sm:flex-row flex-col">
        {type === "reference" && (
          <div className="flex sm:justify-center justify-start sm:w-fit w-full">
            <Dropdown type="collection" />
            <Dropdown type="searchType" />
          </div>
        )}
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-[33px] stroke-primary" />
            {search.length > 0 && (
              <CircleX
                className="absolute top-[35px] right-3.5 w-6 h-6 fill-gray-700 stroke-white hover: cursor-pointer"
                onClick={handleReset}
              />
            )}
            <input
              type="text"
              placeholder="검색어를 입력해 주세요"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className=" w-full py-[9px] pl-14 pr-3 my-6 bg-[#f9faf9] rounded-[50px] border border-gray-200 gap-2 truncate focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <button
            onClick={() => handleSearch(search)}
            className="sm:w-[100px] w-[90px] h-[50px] flex justify-center items-center bg-[#1abc9c] rounded-[50px] hover:bg-primary-dark"
          >
            <Search className="stroke-white" />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex flex-1 mb-5 gap-2 w-full">
        {sort.collections.slice(0, visibleCount).map((tag, index) => (
          <div
            key={index}
            ref={(el) => (tagRefs.current[index] = el)}
            className="flex sm:px-5 px-3.5 sm:py-[13px] py-[10px] bg-[#fbbc05]/10 rounded-[50px] border border-[#fbbc05] items-center justify-center gap-2 inline-flex"
          >
            <p className="sm:text-base text-sm font-normal leading-normal truncate">
              {tag}
            </p>
            <X
              className="stroke-black w-3 hover:cursor-pointer"
              onClick={() =>
                setSort((prev) => ({
                  ...prev,
                  collections: prev.collections.filter((i) => i !== tag),
                }))
              }
            />
          </div>
        ))}

        {visibleCount < sort.collections.length && (
          <div
            ref={moreRef}
            className="flex px-6 py-[13px] bg-[#fbbc05]/10 rounded-[50px] border border-[#fbbc05] items-center justify-center gap-2 inline-flex"
          >
            <p className="text-lg font-bold leading-normal">
              +{sort.collections.length - visibleCount}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
