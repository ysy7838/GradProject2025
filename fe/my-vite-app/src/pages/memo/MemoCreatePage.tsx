// src/pages/memo/MemoCreatePage.tsx
import React, {useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/contexts/useToast";
import KeywordInput from "@/components/memo/KeywordInput";
import Header, {HeaderAction} from "@/components/layout/Header";
import Modal from "@/components/common/Modal";
import {Input} from "@/components/common/Input";
import {Button} from "@/components/common/Button";
import {createMemo, getRecommendedTags, updateMemo} from "@/services/memo";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {Loader} from "lucide-react";

interface MemoFormData {
  title: string;
  tags: string[];
  content: string;
}

export default function MemoCreatePage() {
  const navigate = useNavigate();
  const {showToast} = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [newlyCreatedMemoId, setNewlyCreatedMemoId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  const initialFormState = useRef<MemoFormData>({
    title: "",
    tags: [],
    content: "",
  });

  const [formData, setFormData] = useState<MemoFormData>(initialFormState.current);

  const handleSave = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      showToast("제목 혹은 내용을 입력해 주세요.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const newMemo = await createMemo({
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
      });
      setNewlyCreatedMemoId(newMemo._id);
      showToast("메모가 성공적으로 생성되었습니다.", "success");
      if (newMemo._id) {
        setShowConfirmModal(true);
      } else {
        navigate(`/memos/${newMemo._id}`);
      }
    } catch (error) {
      showToast("메모 생성에 실패했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = () => JSON.stringify(formData) !== JSON.stringify(initialFormState.current);

  const handleConfirmRecommend = async () => {
    setShowConfirmModal(false);
    if (!newlyCreatedMemoId) return;
    try {
      setIsTagsLoading(true);
      setShowTagsModal(true);
      const tags = await getRecommendedTags(newlyCreatedMemoId);
      setRecommendedTags(tags);
      setSelectedTags([]);
    } catch (error) {
      showToast("해시태그 추천을 가져오는데 실패했습니다.", "error");
      setShowTagsModal(false);
      navigate(`/memos/${newlyCreatedMemoId}`);
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
    if (!newlyCreatedMemoId) return;
    try {
      await updateMemo(newlyCreatedMemoId, {
        title: formData.title,
        content: formData.content,
        tags: selectedTags,
      });
      showToast("해시태그가 성공적으로 수정되었습니다.", "success");
      setShowTagsModal(false);
      navigate(`/memos/${newlyCreatedMemoId}`);
    } catch (error) {
      showToast("해시태그 수정에 실패했습니다.", "error");
    }
  };

  const handleCloseRecommendModal = () => {
    setShowTagsModal(false);
    navigate(`/memos/${newlyCreatedMemoId}`);
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate("/memos");
    }
  };

  const handleHeaderAction = (action: HeaderAction) => {
    switch (action) {
      case "back":
        handleBack();
        break;
      case "save":
        handleSave();
        break;
    }
  };

  const quillModules = {
    toolbar: [
      [{header: [1, 2, false]}],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{list: "ordered"}, {list: "bullet"}],
      [{color: []}, {background: []}],
      ["link", "clean"],
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        actions={["back", "save", "add", "more"]} // 👈 규칙에 맞는 버튼 설정
        onAction={handleHeaderAction}
        isLoading={isSubmitting}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="제목"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full text-2xl font-bold border-b focus:outline-none"
            />
          </div>
          <div>
            <KeywordInput
              keywords={formData.tags}
              onChange={(tags) => setFormData({...formData, tags})}
              maxKeywords={10}
              maxLength={15}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => setFormData({...formData, content: value})}
              modules={quillModules}
              placeholder="내용을 입력하세요."
              className="h-96"
            />
          </div>
        </form>
      </div>

      <Modal isOpen={showUnsavedChangesModal} onClose={() => setShowUnsavedChangesModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-center mb-2">작업 중인 내용이 있습니다.</h3>
          <p className="text-center text-gray-600 mb-6">저장하시겠습니까?</p>
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={() => navigate("/memos")} className="flex-1">취소</Button>
            <Button variant="primary" onClick={handleSave} className="flex-1">확인</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showConfirmModal} onClose={() => navigate(`/memos/${newlyCreatedMemoId}`)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-center mb-2">메모가 성공적으로 생성되었습니다.</h3>
          <p className="text-center text-gray-600 mb-6">자동 해시태그를 생성하시겠습니까?</p>
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={() => navigate(`/memos/${newlyCreatedMemoId}`)} className="flex-1">아니요</Button>
            <Button variant="primary" onClick={handleConfirmRecommend} className="flex-1">예</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTagsModal} onClose={handleCloseRecommendModal}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-center mb-4">
            {isTagsLoading ? "해시태그 추천 중..." : "추천 해시태그"}
          </h3>
          {isTagsLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-center text-gray-500 mb-4 text-sm">추가하고 싶은 태그를 선택하세요.</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[80px]">
                {recommendedTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleTagSelection(tag)}
                    className={`px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-white font-semibold"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    # {tag}
                  </button>
                ))}
              </div>
              <div className="flex w-full gap-2">
                <Button variant="outline" onClick={handleCloseRecommendModal} className="flex-1">취소</Button>
                <Button variant="primary" onClick={handleSaveTags} className="flex-1">확인</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
