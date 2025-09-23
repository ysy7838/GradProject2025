// src/components/memo/RecommendedMemosModal.tsx

import React from "react";
import {Memo} from "@/services/memo";
import {X, Loader} from "lucide-react";
import {useNavigate} from "react-router-dom";

interface RecommendedMemosModalProps {
  memos: Memo[];
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

// HTML 태그를 제거하고 일반 텍스트만 추출하는 함수
const stripHtmlTags = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
};

const RecommendedMemosModal: React.FC<RecommendedMemosModalProps> = ({memos, isOpen, onClose, isLoading}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleMemoClick = (memoId: string) => {
    onClose();
    navigate(`/memos/${memoId}`);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-dark-bg rounded-t-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-xl font-bold">관련 메모 추천</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
          <X size={24} />
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-2 text-gray-500">추천 메모를 불러오는 중...</p>
          </div>
        ) : memos.length > 0 ? (
          <div className="space-y-4">
            {memos.map((memo) => (
              <div
                key={memo._id}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer"
                onClick={() => handleMemoClick(memo._id)}
              >
                <h4 className="font-semibold text-lg line-clamp-1">{memo.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                  {/* stripHtmlTags 함수 호출 전에 content가 있는지 확인 */}
                  {stripHtmlTags(memo.content)}
                </p>
                {memo.tags && memo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memo.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag._id}
                        className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5"
                      >
                        #{tag.tagName}
                      </span>
                    ))}
                    {memo.tags.length > 3 && <span className="text-xs text-gray-500">+{memo.tags.length - 3}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">추천 메모가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default RecommendedMemosModal;
