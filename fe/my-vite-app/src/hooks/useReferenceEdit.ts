// src/hooks/useReferenceEdit.ts - improved updateReference method

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/contexts/useToast";
import { referenceService } from "@/services/reference";
import type { ReferenceFormData, CreateReferenceFile } from "@/types/reference";

export function useReferenceEdit() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const updateReference = async (
    referenceId: string,
    formData: ReferenceFormData
  ) => {
    try {
      setIsLoading(true);

      // 필수 필드 검증
      if (!formData.collectionId) {
        showToast("컬렉션을 선택해 주세요.", "error");
        return;
      }
      if (!formData.title) {
        showToast("제목을 입력해 주세요.", "error");
        return;
      }

      // 링크 형식 유효성 검사 추가
      const invalidLinks = formData.files.filter(
        (file: CreateReferenceFile) =>
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

      // 파일 검증 - 빈 파일 체크 및 타입별 검증
      if (formData.files.some((file: CreateReferenceFile) => !file.content)) {
        showToast("모든 자료를 입력해 주세요.", "error");
        return;
      }

      // 디버깅 정보 기록 - 원본 경로 정보 확인
      console.log(
        "업데이트 준비 중인 파일:",
        formData.files.map((file) => ({
          type: file.type,
          originalPath: file.originalPath,
          content: file.content.substring(0, 30) + "...",
        }))
      );

      // 파일 데이터 준비 (원본 경로 정보 명시적 전달)
      const filesFormData = referenceService.prepareFilesFormData(
        formData.files
      );

      // 레퍼런스 수정 API 호출
      const response = await referenceService.updateReference(referenceId, {
        collectionId: formData.collectionId,
        title: formData.title,
        keywords: formData.keywords,
        memo: formData.memo,
        files: filesFormData,
      });

      showToast("레퍼런스가 수정되었습니다.", "success");
      navigate(`/references/${referenceId}`);
      return response;
    } catch (error: any) {
      console.error("레퍼런스 수정 실패:", error);

      if (error.response?.status === 404) {
        showToast("해당 레퍼런스를 찾을 수 없습니다.", "error");
      } else if (error.response?.status === 413) {
        showToast(
          "파일 크기가 너무 큽니다. 파일당 20MB 이하로 업로드해주세요.",
          "error"
        );
      } else if (error.message) {
        showToast(error.message, "error");
      } else {
        showToast("레퍼런스 수정에 실패했습니다.", "error");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateReference,
    isLoading,
  };
}
