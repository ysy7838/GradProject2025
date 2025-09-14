// src/hooks/useReferenceCreate.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/contexts/useToast";
import { referenceService } from "@/services/reference";

interface ReferenceFormData {
  collectionId: string;
  collectionTitle: string;
  title: string;
  keywords: string[];
  memo: string;
  files: Array<{
    id: string;
    type: "link" | "image" | "pdf" | "file";
    content: string;
    name?: string;
  }>;
}

export function useReferenceCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createReference = async (formData: ReferenceFormData) => {
    try {
      setIsLoading(true);

      // 필수 필드 검증
      if (!formData.collectionTitle) {
        showToast("컬렉션을 선택해 주세요.", "error");
        return;
      }
      if (!formData.title) {
        showToast("제목을 입력해 주세요.", "error");
        return;
      }

      // 링크 형식 유효성 검사 추가
      const invalidLinks = formData.files.filter(
        (file) =>
          file.type === "link" &&
          file.content &&
          !(
            file.content.startsWith("http://") ||
            file.content.startsWith("https://")
          )
      );

      if (invalidLinks.length > 0) {
        showToast(
          "http:// 또는 https://로 시작하는 링크를 입력해 주세요.",
          "error"
        );
        return;
      }

      // 빈 파일 체크
      if (formData.files.some((file) => !file.content)) {
        showToast("모든 자료를 입력해 주세요.", "error");
        return;
      }

      // Prepare files
      const filesFormData = referenceService.prepareFilesFormData(
        formData.files
      );

      // Create reference
      const response = await referenceService.createReference({
        collectionId: formData.collectionId,
        title: formData.title,
        keywords: formData.keywords,
        memo: formData.memo,
        files: filesFormData,
      });
      showToast("레퍼런스가 등록되었습니다.", "success");
      navigate(`/references/${response.reference._id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast("해당 컬렉션을 찾을 수 없습니다.", "error");
      } else if (error.response?.status === 413) {
        showToast(
          "파일 크기가 너무 큽니다. 파일당 20MB 이하로 업로드해주세요.",
          "error"
        );
      } else {
        showToast("레퍼런스 등록에 실패했습니다.", "error");
      }
      return; // 명시적으로 early return하여 실패 시 추가 동작 방지
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createReference,
    isLoading,
  };
}
