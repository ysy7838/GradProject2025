// src/components/reference/ReferenceList.tsx
import { useNavigate } from "react-router-dom";
import { Reference as ReferenceCardProps } from "@/types/reference";
import {
  collectionState,
  alertState,
  floatingModeState,
} from "@/store/collection";
import { useRecoilValue, useSetRecoilState, useRecoilState } from "recoil";
import { EllipsisVertical, PencilLine, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface DataTableProps {
  items: ReferenceCardProps[];
}

const headers = [
  { title: "NO.", width: "5%" },
  { title: "컬렉션", width: "15%" },
  { title: "제목", width: "35%" },
  { title: "키워드", width: "25%" },
  { title: "최근 수정일시", width: "15%" }, // 수정: "등록 일시" → "최근 수정일시"
  { title: "", width: "5%" },
];

export default function ReferenceList({ items = [] }: DataTableProps) {
  const navigate = useNavigate();
  const collectionData = useRecoilValue(collectionState);
  const setAlert = useSetRecoilState(alertState);
  const [modeValue, setModeValue] = useRecoilState(floatingModeState);
  const [isTotal, setIsTotal] = useState(false);
  const [isChecked, setIsChecked] = useState(Array(items.length).fill(false));
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLTableDataCellElement | null }>(
    {}
  );
  const keywordContainerRefs = useRef<Record<string, HTMLDivElement | null>>(
    {}
  );
  const keywordRefs = useRef<Record<string, HTMLSpanElement[]>>({});
  const [visibleKeywords, setVisibleKeywords] = useState<
    Record<string, number>
  >({});

  const calculateVisibleTags = useCallback(() => {
    const newVisibleKeywords: Record<string, number> = {};

    items.forEach((item) => {
      const container = keywordContainerRefs.current[item._id];
      if (!container) return;

      const containerWidth = container.offsetWidth; // 컨테이너 너비
      let totalWidth = 0;
      const keywords = item.keywords ?? [];
      let lastVisibleIndex = keywords.length;

      for (let i = 0; i < keywords.length; i++) {
        const keywordEl = keywordRefs.current[item._id]?.[i];
        if (!keywordEl) continue;

        const keywordWidth = keywordEl.offsetWidth; // 🔥 실제 키워드 너비 가져오기
        totalWidth += keywordWidth + 4; // 여백 포함

        if (totalWidth > containerWidth - 30) {
          // "더보기" 버튼 고려
          lastVisibleIndex = i;
          break;
        }
      }
      newVisibleKeywords[item._id] = lastVisibleIndex;
    });

    setVisibleKeywords(newVisibleKeywords);
  }, [items]);

  useEffect(() => {
    calculateVisibleTags();
    window.addEventListener("resize", calculateVisibleTags);
    return () => window.removeEventListener("resize", calculateVisibleTags);
  }, [calculateVisibleTags]);

  useEffect(() => {
    setIsChecked(Array(items.length).fill(false));
  }, [modeValue.isDelete, modeValue.isMove, items.length]);

  useEffect(() => {
    items.length === isChecked.filter((i) => i === true).length
      ? setIsTotal(true)
      : setIsTotal(false);
  }, [isChecked, items.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId]?.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.id === "total") {
      if (isTotal) {
        setIsTotal(false);
        setIsChecked((prev) => prev.map(() => false));
        setModeValue((prev) => ({
          ...prev,
          checkItems: [],
        }));
      } else {
        setIsTotal(true);
        setIsChecked((prev) => prev.map(() => true));
        setModeValue((prev) => ({
          ...prev,
          checkItems: items
            .filter((item) => !item.viewer)
            .map((item) => item._id),
        }));
      }
    } else {
      setIsChecked((prev) => {
        const newState = [...prev];
        newState[index] = e.target.checked;
        return newState;
      });
      setModeValue((prev) => ({
        ...prev,
        checkItems: prev.checkItems.includes(e.target.id)
          ? prev.checkItems.filter((i) => i !== e.target.id)
          : [...prev.checkItems, e.target.id],
      }));
    }
  };

  const handleRowClick = (
    id: string,
    event: React.MouseEvent,
    index: number
  ) => {
    if (
      (event.target as HTMLElement).closest(".more-button") ||
      (event.target as HTMLElement).closest("input[type='checkbox']") ||
      (event.target as HTMLElement).closest("label")
    ) {
      return;
    }

    if (modeValue.isMove || modeValue.isDelete) {
      setIsChecked((prev) => {
        const newState = [...prev];
        newState[index] = !newState[index];
        return newState;
      });
      setModeValue((prev) => ({
        ...prev,
        checkItems: prev.checkItems.includes(id)
          ? prev.checkItems.filter((i) => i !== id)
          : [...prev.checkItems, id],
      }));
    } else {
      navigate(`/references/${id}`);
    }
  };

  const handleDelete = (item: ReferenceCardProps) => {
    const collectionTitle = collectionData.data.find(
      (i) => i._id === item.collectionId
    )?.title;

    const text = item.shared
      ? `${collectionTitle} 컬렉션의 다른 사용자와 공유 중인 ${item.title}를 삭제하시겠습니까? \n삭제 후 복구할 수 없습니다.`
      : `${item.title}를 삭제하시겠습니까? \n삭제 후 복구할 수 없습니다.`;

    setAlert({
      ids: [item._id],
      massage: text,
      isVisible: true,
      type: "reference",
      title: "",
    });
    setOpenMenuId(null);
  };

  const handleEdit = (id: string) => {
    navigate(`/references/${id}/edit`);
    setOpenMenuId(null);
  };

  // 날짜 포맷팅 함수 추가 - 시간 포함
  const formatDate = (createdAt: string, updatedAt?: string): string => {
    // 수정일시가 있고 생성일시와 다른 경우 → 수정일시 표시
    if (updatedAt && updatedAt !== createdAt) {
      const date = new Date(updatedAt);
      return formatDateTime(date);
    } else {
      // 수정일시가 없거나 생성일시와 같은 경우 → 생성일시 표시
      const date = new Date(createdAt);
      return formatDateTime(date);
    }
  };

  // 날짜와 시간을 한국어 형식으로 포맷팅하는 함수
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    // 오전/오후 결정
    const period = hours < 12 ? "오전" : "오후";
    // 12시간 형식으로 변환
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedHours = displayHours.toString().padStart(2, "0");

    return `${year}.${month}.${day} ${period} ${formattedHours}:${minutes}:${seconds}`;
  };

  return (
    <table
      className="table-auto border-collapse w-full"
      data-testid="reference-list"
    >
      <thead className="bg-gray-100">
        <tr>
          {(modeValue.isMove || modeValue.isDelete) && (
            <th className="w-[5%] pl-3">
              <div>
                <input
                  type="checkbox"
                  id="total"
                  checked={isTotal}
                  onChange={(e) => handleChange(e, 0)}
                  className="hidden"
                />
                <label
                  htmlFor="total"
                  className={`w-5 h-5 border-2 border-primary text-white flex items-center justify-center rounded cursor-pointer ${
                    isTotal ? "bg-primary" : "bg-white"
                  }`}
                >
                  {isTotal && "✔"}
                </label>
              </div>
            </th>
          )}
          {headers.map((header) => (
            <th
              key={header.title}
              style={{ width: header.width }}
              className="text-center text-black text-base font-semibold py-4 first:rounded-l-lg last:rounded-r-lg"
            >
              {header.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const keywords = item.keywords ?? [];
          const visibleCount = visibleKeywords[item._id] ?? keywords.length;
          return (
            <tr
              key={index}
              onClick={(e) => handleRowClick(item._id, e, index)}
              className={`text-center text-black text-base font-normal border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors duration-200 ${
                (modeValue.isMove || modeValue.isDelete) && item.viewer
                  ? "opacity-40"
                  : ""
              }`}
            >
              {(modeValue.isMove || modeValue.isDelete) && (
                <td className="pl-3">
                  <div className={item.viewer ? "invisible" : ""}>
                    <input
                      type="checkbox"
                      id={item._id}
                      checked={isChecked[index]}
                      onChange={(e) => handleChange(e, index)}
                      className="hidden"
                    />
                    <label
                      htmlFor={item._id}
                      className={`w-5 h-5 border-2 border-primary text-white flex items-center justify-center rounded cursor-pointer ${
                        isChecked[index] ? "bg-primary" : "bg-white"
                      }`}
                    >
                      {isChecked[index] && "✔"}
                    </label>
                  </div>
                </td>
              )}
              <td className="py-4">{index + 1}</td>
              <td className="py-4 px-2 truncate">
                {collectionData.data.find((i) => i._id === item.collectionId)
                  ?.title || null}
              </td>
              <td className="py-4 px-4 text-center truncate">{item.title}</td>
              <td className="py-4">
                <div
                  ref={(el) => (keywordContainerRefs.current[item._id] = el)}
                  className="flex flex-wrap justify-center gap-1.5 px-2"
                >
                  {item.keywords?.slice(0, visibleCount).map((word, index) => (
                    <span
                      key={index}
                      ref={(el) => {
                        if (!keywordRefs.current[item._id])
                          keywordRefs.current[item._id] = [];
                        if (el) keywordRefs.current[item._id][index] = el;
                      }}
                      className="px-2 py-1 bg-[#0a306c] rounded text-gray-100 text-xs font-medium whitespace-nowrap"
                    >
                      {word}
                    </span>
                  ))}
                  {visibleCount < keywords.length && (
                    <span className="px-2 py-1 bg-[#0a306c] rounded text-gray-100 text-xs font-medium">
                      +{keywords.length - visibleCount}
                    </span>
                  )}
                </div>
              </td>
              {/* 수정된 날짜 표시 로직 */}
              <td className="py-4">
                {formatDate(item.createdAt, item.updatedAt)}
              </td>
              <td
                className="relative py-4"
                ref={(el) => (menuRefs.current[item._id] = el)}
              >
                <div
                  className={`more-button flex justify-center ${
                    item.viewer ? "invisible" : ""
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === item._id ? null : item._id);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <EllipsisVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {openMenuId === item._id && (
                    <div className="absolute top-full right-0 mt-1 z-10">
                      <ul className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item._id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <PencilLine className="w-4 h-4 stroke-primary" />
                            <span>수정</span>
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4 stroke-[#f65063]" />
                            <span>삭제</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
