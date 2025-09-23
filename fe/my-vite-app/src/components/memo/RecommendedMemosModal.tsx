import React, {useState, useEffect} from "react";
import {Memo} from "@/services/memo";
import {Hash, ChevronLeft, ChevronRight} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";

interface RecommendedMemosModalProps {
  memos: Memo[];
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

const stripHtmlTags = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
};

// 👇 로딩 애니메이션을 위한 Dot 컴포넌트
const LoadingDots = () => (
  <div className="flex space-x-2">
    <motion.span
      className="w-3 h-3 bg-primary rounded-full"
      animate={{y: [0, -8, 0]}}
      transition={{duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0}}
    />
    <motion.span
      className="w-3 h-3 bg-gray-300 rounded-full"
      animate={{y: [0, -8, 0]}}
      transition={{duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2}}
    />
    <motion.span
      className="w-3 h-3 bg-gray-300 rounded-full"
      animate={{y: [0, -8, 0]}}
      transition={{duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4}}
    />
  </div>
);

const RecommendedMemosModal: React.FC<RecommendedMemosModalProps> = ({memos, isOpen, onClose, isLoading}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const handleMemoClick = (memoId: string) => {
    onClose();
    navigate(`/memos/${memoId}`);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < memos.length - 1 ? prev + 1 : prev));
  };

  const dropIn = {
    hidden: {
      y: "100%",
      transition: {
        duration: 0.3,
        type: "tween",
        ease: "easeInOut",
      },
    },
    visible: {
      y: "0%",
      transition: {
        duration: 0.4,
        type: "tween",
        ease: "easeInOut",
      },
    },
    exit: {
      y: "100%",
      transition: {
        duration: 0.3,
        type: "tween",
        ease: "easeInOut",
      },
    },
  } as const;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <p className="text-xl font-bold text-gray-900 mb-6">찾는 중</p>
          <LoadingDots />
        </div>
      );
    }

    if (memos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">아직 추천할 메모가 없어요</p>
          <p className="text-gray-500">
            메모를 더 작성하시면
            <br />
            맞춤 추천을 받을 수 있어요
          </p>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="overflow-hidden">
          <motion.div
            className="flex"
            animate={{x: `-${currentIndex * 100}%`}}
            transition={{type: "spring", stiffness: 300, damping: 30}}
          >
            {memos.map((memo) => (
              <div key={memo._id} className="flex-shrink-0 w-full p-1" onClick={() => handleMemoClick(memo._id)}>
                <div className="bg-white p-4 rounded-lg h-48 flex flex-col cursor-pointer">
                  <h4 className="font-bold text-lg p-2 text-gray-900 truncate">{memo.title || "-"}</h4>
                  <p
                    className={`text-gray-700 pl-2 pr-2 text-md mt-1 ${
                      memo.tags && memo.tags.length > 0 ? "line-clamp-2" : "line-clamp-4"
                    }`}
                  >
                    {stripHtmlTags(memo.content)}
                  </p>
                  {memo.tags && memo.tags.length > 0 && (
                    <div className="mt-auto pt-2 pl-1 pr-1 overflow-hidden whitespace-nowrap">
                      <div className="flex gap-1.5">
                        {memo.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="flex items-center bg-primary-0 text-primary-200 px-3 py-1 mr-2 rounded-full gap-1.5 text-md font-bold"
                          >
                            <Hash size={16}></Hash>
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        {memos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-1 bg-white rounded-full shadow-md disabled:opacity-50"
            >
              <ChevronLeft className="text-gray-600" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === memos.length - 1}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 p-1 bg-white rounded-full shadow-md disabled:opacity-50"
            >
              <ChevronRight className="text-gray-600" />
            </button>
          </>
        )}
      </div>
    );
  };
  return (
    <AnimatePresence>
      {isOpen && (
        // 👇 items-end로 변경하여 모달을 하단에 위치시킴
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-30"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={onClose}
          />
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-gray-100 rounded-t-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            {/* 상단 손잡이 UI */}
            <div className="w-full py-3 flex justify-center">
              <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="p-4 pt-0">
              <h3 className="typo-h3 font-bold mb-4 flex items-center pl-2 pr-2">
                <Hash size={20} className="text-primary mr-2" />
                <span>이런 메모는 어때요?</span>
              </h3>
              <div className="p-2 pt-0 rounded-xl">{renderContent()}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecommendedMemosModal;