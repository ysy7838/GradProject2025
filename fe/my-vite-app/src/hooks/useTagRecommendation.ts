import {useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/contexts/useToast";
import {getRecommendedTags, updateMemo} from "@/services/memo";

interface MemoData {
  title: string;
  content: string;
  tags?: string[];
}

export const useTagRecommendation = () => {
  const navigate = useNavigate();
  const {showToast} = useToast();

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  const handleRecommendTags = useCallback(
    async (memoId: string) => {
      try {
        setIsTagsLoading(true);
        const tags = await getRecommendedTags(memoId);
        setRecommendedTags(tags);
        setSelectedTags([]);
        setShowTagsModal(true);
      } catch (error) {
        showToast("해시태그 추천을 가져오는데 실패했습니다.", "error");
        // 추천 실패 시, 상세 페이지로 이동할지 말지는 호출하는 컴포넌트에서 결정
      } finally {
        setIsTagsLoading(false);
      }
    },
    [showToast]
  );

  const handleTagSelection = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);

  const handleSaveTags = useCallback(
    async (memoId: string, memoData: MemoData) => {
      try {
        await updateMemo(memoId, {
          title: memoData.title,
          content: memoData.content,
          tags: selectedTags,
        });
        showToast("해시태그가 성공적으로 수정되었습니다.", "success");
        setShowTagsModal(false);
        return true; // 성공 시 true 반환
      } catch (error) {
        showToast("해시태그 수정에 실패했습니다.", "error");
        return false; // 실패 시 false 반환
      }
    },
    [selectedTags, showToast]
  );

  const handleCloseModal = useCallback(() => {
    setShowTagsModal(false);
  }, []);

  return {
    showTagsModal,
    recommendedTags,
    selectedTags,
    isTagsLoading,
    handleRecommendTags,
    handleTagSelection,
    handleSaveTags,
    handleCloseModal,
  };
};