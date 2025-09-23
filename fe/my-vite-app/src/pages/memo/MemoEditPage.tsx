// src/pages/memo/MemoEditPage.tsx
import React, {useState, useEffect, useRef, useCallback} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useToast} from "@/contexts/useToast";
import KeywordInput from "@/components/reference/KeywordInput";
import Header, {HeaderAction} from "@/components/layout/Header";
import Modal from "@/components/common/Modal"; // Modal 컴포넌트 import
import {getMemo, updateMemo, MemoRequest, deleteMemo} from "@/services/memo";
import {Loader} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/common/Button";

export default function MemoEditPage() {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {showToast} = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quillRef = useRef<ReactQuill | null>(null);

  const [formData, setFormData] = useState<MemoRequest>({
    title: "",
    tags: [],
    content: "",
  });
  const [originalFormData, setOriginalFormData] = useState<MemoRequest>({
    title: "",
    tags: [],
    content: "",
  });
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        const memoData = {
          title: data.title,
          content: data.content,
          tags: data.tags ? data.tags.map((tag) => tag.tagName) : [],
        };
        setFormData(memoData);
        setOriginalFormData(memoData); // 원본 데이터 저장
      } catch (error) {
        showToast("메모 데이터를 불러오는데 실패했습니다.", "error");
        navigate(`/memos/${id}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemo();
  }, [id, navigate, showToast]);

  const handleUpdate = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      showToast("제목 혹은 내용을 입력해 주세요.", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      await updateMemo(id as string, formData);
      showToast("메모가 성공적으로 수정되었습니다.", "success");
      setOriginalFormData(formData); // 저장 후 원본 데이터 업데이트
      navigate(`/memos/${id}`);
    } catch (error) {
      showToast("메모 수정에 실패했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  };

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(-1);
    }
  }, [navigate, formData, originalFormData]);

  const handleDelete = () => {
    setShowDeleteModal(true); // 삭제 모달 열기
  };

  const handleHeaderAction = (action: HeaderAction) => {
    switch (action) {
      case "back":
        handleBack();
        break;
      case "save":
        handleUpdate();
        break;
      case "delete":
        handleDelete();
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      await deleteMemo([id]);
      showToast("메모가 성공적으로 삭제되었습니다.", "success");
      navigate("/memos"); // 👈 삭제 후 리스트로 이동
    } catch (error) {
      showToast("메모 삭제에 실패했습니다.", "error");
    } finally {
      setShowDeleteModal(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        actions={["back", "save", "add", "more", "delete"]} // 👈 'delete' 포함 확인
        onAction={handleHeaderAction}
        isLoading={isSubmitting}
      />
      <div className="p-4 space-y-4">
        <input
          type="text"
          placeholder="제목"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full text-2xl font-bold border-none focus:ring-0 px-0 placeholder-gray-400"
        />
        <KeywordInput
          keywords={formData.tags || []}
          onChange={(tags) => setFormData({...formData, tags})}
          disabled={isSubmitting}
        />
        <div className="memo-editor-container">
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(value) => setFormData({...formData, content: value})}
            modules={quillModules}
            placeholder="내용을 입력하세요."
            className="min-h-[calc(100vh-250px)]"
          />
        </div>
      </div>

      {/* 저장되지 않은 내용 확인 모달 */}
      <Modal isOpen={showUnsavedChangesModal} onClose={() => setShowUnsavedChangesModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-center mb-2">작업 중인 내용이 있습니다.</h3>
          <p className="text-center text-gray-600 mb-6">저장하시겠습니까?</p>
          {/* 👇 버튼을 'Fill' 스타일로 수정 */}
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              취소
            </Button>
            <Button variant="primary" onClick={handleUpdate} className="flex-1">
              확인
            </Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-center mb-2">메모를 삭제하시겠어요?</h3>
          <p className="text-center text-gray-600 mb-6">삭제된 메모는 복구할 수 없어요.</p>
          {/* 👇 버튼을 'Fill' 스타일로 수정 */}
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
    </div>
  );
}