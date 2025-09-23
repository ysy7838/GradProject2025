// src/pages/memo/MemoDetailPage.tsx

import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useToast} from "@/contexts/useToast";
import Header, {HeaderAction} from "@/components/layout/Header";
import Modal from "@/components/common/Modal";
import RecommendedMemosModal from "@/components/memo/RecommendedMemosModal";
import {getMemo, deleteMemo, updateMemo, getRecommendedTags, getRecommendedMemos, toggleFavorite} from "@/services/memo";
import {Edit, Loader, Trash2, Plus, Sparkle} from "lucide-react";
import {Memo} from "@/services/memo";
import { Button } from "@/components/common/Button";

// TagList 컴포넌트 (변경 없음)
const TagList = ({tags}: {tags: {_id: string; tagName: string}[]}) => {
  const [showAll, setShowAll] = useState(false);
  const tagNames = tags.map((tag) => tag.tagName);
  const tagContainerClasses = showAll ? "flex flex-wrap gap-2" : "flex flex-wrap gap-2 overflow-hidden max-h-[2.5rem]";

  return (
    <div className="flex flex-col">
      <div className={tagContainerClasses}>
        {tagNames.map((tag, index) => (
          <span
            key={index}
            className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full gap-1.5 text-sm font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      {tagNames.length > 1 && (
        <button onClick={() => setShowAll(!showAll)} className="text-transparent text-sm mt-1 self-start">
          {showAll ? "간략히 보기" : "더보기"}
        </button>
      )}
    </div>
  );
};

export default function MemoDetailPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {showToast} = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [memo, setMemo] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 해시태그 추천 기능 관련 상태
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  // 추천 메모 기능 관련 상태 추가
  const [showRecommendedMemos, setShowRecommendedMemos] = useState(false);
  const [recommendedMemos, setRecommendedMemos] = useState<Memo[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    if (!id) {
      showToast("잘못된 접근입니다.", "error");
      navigate("/memos");
      return;
    }

    const fetchMemo = async () => {
      try {
        setIsLoading(true);
        const data = await getMemo(id);
        setMemo(data);
      } catch (error) {
        showToast("메모를 불러오는데 실패했습니다.", "error");
        navigate("/memos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemo();
  }, [id, navigate, showToast]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleFavorite = async () => {
    if (!id || !memo) return;
    try {
      await toggleFavorite([id], !memo.isFavorite);
      // UI 상태 업데이트
      setMemo((prev: any) => ({
        ...prev,
        isFavorite: !prev.isFavorite,
      }));
      showToast(!memo.isFavorite ? "메모를 즐겨찾기에 추가했습니다." : "메모를 즐겨찾기에서 제거했습니다.", "success");
    } catch (error) {
      showToast("즐겨찾기 상태 변경에 실패했습니다.", "error");
    }
  }

  const handleHeaderAction = (action: HeaderAction) => {
    switch (action) {
      case "back":
        navigate("/memos");
        break;
      case "edit":
        navigate(`/memos/${id}/edit`);
        break;
      case "delete":
        handleDelete();
        break;
      case "toggleFavorite":
        handleFavorite();
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      await deleteMemo([id]);
      showToast("메모가 성공적으로 삭제되었습니다.", "success");
      navigate("/memos");
    } catch (error) {
      showToast("메모 삭제에 실패했습니다.", "error");
    } finally {
      setShowDeleteModal(false);
    }
  };

  // 해시태그 추천 요청 핸들러
  const handleRecommendTags = async () => {
    if (!id) return;
    try {
      setIsTagsLoading(true);
      const tags = await getRecommendedTags(id);
      setRecommendedTags(tags);
      setSelectedTags(memo.tags ? memo.tags.map((tag: any) => tag.tagName) : []);
      setShowTagsModal(true);
    } catch (error) {
      showToast("해시태그 추천을 가져오는데 실패했습니다.", "error");
    } finally {
      setIsTagsLoading(false);
    }
  };

  const handleTagSelection = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSaveTags = async () => {
    if (!id) return;
    try {
      await updateMemo(id, {
        title: memo.title,
        content: memo.content,
        tags: selectedTags,
      });
      setMemo((prev: any) => ({
        ...prev,
        tags: selectedTags.map((tag) => ({_id: tag, tagName: tag})),
      }));
      showToast("해시태그가 성공적으로 수정되었습니다.", "success");
      setShowTagsModal(false);
    } catch (error) {
      showToast("해시태그 수정에 실패했습니다.", "error");
    }
  };

  // 관련 메모 추천 핸들러
  const handleGetRecommendedMemos = async () => {
    if (!id) return;

    try {
      setIsRecommending(true);
      const memos = await getRecommendedMemos(id);
      setRecommendedMemos(memos);
      setShowRecommendedMemos(true);
    } catch (error) {
      showToast("관련 메모를 불러오는데 실패했습니다.", "error");
    } finally {
      setIsRecommending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        actions={["back", "edit", "more", "delete"]} // 👈 규칙에 맞는 버튼 설정
        onAction={handleHeaderAction}
        isFavorite={memo.isFavorite}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">{memo.title}</h1>
          {memo.tags && <TagList tags={memo.tags} />}
          <div className="p-4 bg-gray-100 rounded-lg ql-editor" dangerouslySetInnerHTML={{__html: memo.content}} />
        </div>
      </div>

      {/* 하단에 추천 버튼들 추가 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
        {
          <button
            onClick={handleRecommendTags}
            disabled={isTagsLoading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTagsLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            해시태그 추천
          </button>
        }
        <button
          onClick={handleGetRecommendedMemos}
          disabled={isRecommending}
          className="p-3 bg-white text-primary hover:bg-gray-100 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRecommending ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkle size={24} />}
        </button>
      </div>

      <RecommendedMemosModal
        isOpen={showRecommendedMemos}
        onClose={() => setShowRecommendedMemos(false)}
        memos={recommendedMemos}
        isLoading={isRecommending}
      />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">메모를 삭제하시겠습니까?</h3>
          <p className="mb-6">삭제된 메모는 복구할 수 없습니다.</p>
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
              취소
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} className="flex-1">
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTagsModal || isTagsLoading} onClose={() => setShowTagsModal(false)}>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">
            {isTagsLoading ? (
              <div className="flex flex-col items-center">
                <Loader className="w-6 h-6 animate-spin text-primary mb-2" />
                해시태그 추천 중...
              </div>
            ) : (
              "해시태그 추천"
            )}
          </h3>
          {!isTagsLoading && (
            <>
              <div className="flex flex-wrap gap-2 mb-6">
                {recommendedTags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => handleTagSelection(tag)}
                    className={`
                      inline-flex items-center px-3 py-1 text-sm rounded-full cursor-pointer transition-colors
                      ${selectedTags.includes(tag) ? "bg-primary text-white" : "bg-gray-200 text-gray-800"}
                    `}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-center space-x-4">
                <button onClick={handleSaveTags} className="px-4 py-2 bg-primary text-white rounded-lg">
                  확인
                </button>
                <button onClick={() => setShowTagsModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
