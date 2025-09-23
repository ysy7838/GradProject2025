import React, {useState} from "react";
import {
  ChevronLeft,
  MoreVertical,
  Plus,
  Save,
  Edit,
  Trash2,
  FileDown,
  Search,
  Share2,
  Star,
  Image,
  Camera,
  Scan,
} from "lucide-react";
import DropdownMenu from "@/components/common/DropdownMenu";

export type HeaderAction = "back" | "save" | "add" | "more" | "edit" | "delete" | "toggleFavorite"; // 👈 'toggleFavorite' 추가

interface HeaderProps {
  actions: HeaderAction[];
  onAction: (action: HeaderAction) => void;
  isLoading?: boolean;
  isFavorite?: boolean; // 👈 즐겨찾기 상태를 prop으로 받음
}

export default function Header({actions, onAction, isLoading, isFavorite}: HeaderProps) {
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);

  // '더보기' 메뉴 아이템
  const moreMenuItems = (
    <>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Search size={16} className="mr-3" /> 검색
      </button>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <FileDown size={16} className="mr-3" /> 파일로 저장
      </button>
      <div className="border-t my-1"></div>
      <div className="flex justify-around items-center px-2 py-1">
        <button onClick={() => onAction("toggleFavorite")} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Star size={20} className={isFavorite ? "text-yellow-400" : "text-gray-600"} />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Share2 size={20} />
        </button>
        <button onClick={() => onAction("delete")} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
          <Trash2 size={20} />
        </button>
      </div>
    </>
  );

  // '+' 메뉴 아이템 (기능은 추후 연결)
  const addMenuItems = (
    <>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Image size={20} className="mr-3" /> 이미지
      </button>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Image size={20} className="mr-3" /> 이미지 자동 정리
      </button>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Camera size={20} className="mr-3" /> 카메라
      </button>
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
        <Scan size={20} className="mr-3" /> 스캔
      </button>
    </>
  );

  // 👇 isEditing 대신 actions 배열을 사용하여 버튼을 동적으로 렌더링하도록 개선
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1">
        {actions.includes("back") && (
          <button onClick={() => onAction("back")} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        {actions.includes("edit") && (
          <button onClick={() => onAction("edit")} className="p-2 text-primary hover:bg-gray-100 rounded-full">
            <Edit size={20} />
          </button>
        )}
        {actions.includes("save") && (
          <button
            onClick={() => onAction("save")}
            disabled={isLoading}
            className="p-2 text-primary hover:bg-gray-100 rounded-full"
          >
            <Save size={20} />
          </button>
        )}
        {actions.includes("add") && (
          <div className="relative">
            <button onClick={() => setAddMenuOpen(true)} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
              <Plus size={24} />
            </button>
            <DropdownMenu isOpen={isAddMenuOpen} onClose={() => setAddMenuOpen(false)}>
              {addMenuItems}
            </DropdownMenu>
          </div>
        )}
        {actions.includes("more") && (
          <div className="relative">
            <button onClick={() => setMoreMenuOpen(true)} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
              <MoreVertical size={24} />
            </button>
            <DropdownMenu isOpen={isMoreMenuOpen} onClose={() => setMoreMenuOpen(false)}>
              {moreMenuItems}
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
