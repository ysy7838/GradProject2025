// src/components/common/Alert.tsx
import React, { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { collectionService } from "@/services/collection";
import { referenceService } from "@/services/reference";
import { authService } from "@/services/auth";
import { useToast } from "@/contexts/useToast";
import { useNavigate } from "react-router-dom";
import {
  alertState,
  floatingModeState,
  modalState,
  shareModalState,
} from "@/store/collection";
import { userState, authUtils } from "@/store/auth";
import { useRecoilState, useSetRecoilState } from "recoil";

interface AlertProps {
  message: string;
}

const Alert: React.FC<AlertProps> = ({ message }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [alert, setAlert] = useRecoilState(alertState);
  const setMode = useSetRecoilState(floatingModeState);
  const setModal = useSetRecoilState(modalState);
  const setShareModal = useSetRecoilState(shareModalState);
  const setUser = useSetRecoilState(userState);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    // 중복 실행 방지
    if (isProcessing) return;

    try {
      // 회원탈퇴 확인 케이스
      if (alert.type === "withdrawal") {
        try {
          setIsProcessing(true);

          // Alert 창 즉시 닫기
          setAlert((prev) => ({ ...prev, isVisible: false }));

          // 회원탈퇴 API 호출
          await authService.deleteUser();

          // 성공 시 로그인 정보 삭제
          authUtils.clearAll(); // 로컬 스토리지 정리
          setUser(null); // Recoil 상태 초기화

          // 즉시 로그인 페이지로 이동하면서 토스트 메시지 표시
          navigate("/auth/login", { replace: true });
          
          // 페이지 이동 후 토스트 메시지 표시
          setTimeout(() => {
            showToast(
              "회원 탈퇴가 정상적으로 완료되었습니다. 7일 이내 재 로그인 시 계정이 복구됩니다.",
              "success"
            );
          }, 100); // 페이지 이동 후 약간의 지연으로 토스트 표시

        } catch (error) {
          // 에러 처리
          if (error instanceof Error) {
            showToast(error.message, "error");
          } else {
            showToast("회원탈퇴 중 오류가 발생했습니다.", "error");
          }
        } finally {
          setIsProcessing(false);
        }

        // 더 이상 진행하지 않고 종료
        return;
      }

      // 회원탈퇴 완료 알림 케이스 - 레거시 처리 (혹시 모를 상황 대비)
      if (alert.type === "withdrawalComplete") {
        // Alert 창 닫기
        setAlert((prev) => ({ ...prev, isVisible: false }));

        // React Router를 사용하여 로그인 페이지로 이동
        navigate("/auth/login", { replace: true });

        // 더 이상 진행하지 않고 종료
        return;
      }

      // 다른 케이스들 처리
      if (alert.type === "collection") {
        await collectionService.deleteCollection(alert.ids);
        showToast("삭제가 완료되었습니다.", "success");
      } else if (alert.type === "collectionDetail") {
        await collectionService.deleteCollection(alert.ids);
        showToast("삭제가 완료되었습니다.", "success");
        navigate(`/collections`);
      } else if (alert.type === "move") {
        await referenceService.moveReference(alert.ids, alert.title);
        showToast("컬렉션 이동이 완료되었습니다.", "success");
        setModal({ type: "", isOpen: false, id: "", title: "" });
      } else if (alert.type === "sharePrivate") {
        await collectionService.setPrivate(alert.ids[0]);
        setShareModal((prev) => ({ ...prev, isOpen: false, collectionId: "" }));
        showToast("나만 보기 설정이 되었습니다.", "success");
      } else if (alert.type === "shareRemove") {
        await collectionService.deleteSharedUsers(alert.ids[0], alert.ids[1]);
        showToast("삭제되었습니다.", "success");
      } else if (alert.type === "shareOut") {
        await collectionService.deleteSharedUsers(alert.ids[0], alert.ids[1]);
        setShareModal((prev) => ({ ...prev, isOpen: false, collectionId: "" }));
        navigate(`/collections`);
        showToast("컬렉션에서 나갔습니다.", "success");
      } else if (alert.type === "collectionDetailRemoveRef") {
        if (alert.ids.length === 1) {
          await referenceService.deleteReference(alert.ids[0]);
          showToast("삭제가 완료되었습니다.", "success");
        } else {
          await referenceService.deleteReferences(alert.ids);
          showToast("삭제가 완료되었습니다.", "success");
        }
      } else {
        if (alert.ids.length === 1) {
          await referenceService.deleteReference(alert.ids[0]);
          showToast("삭제가 완료되었습니다.", "success");

          // 상세 페이지에서 삭제한 경우 레퍼런스 목록으로 리디렉션
          if (
            window.location.pathname.includes(`/references/${alert.ids[0]}`)
          ) {
            navigate("/references");
          }
          // 그 외의 경우는 현재 페이지 유지 (리스트에서 삭제한 경우)
        } else {
          await referenceService.deleteReferences(alert.ids);
          showToast("삭제가 완료되었습니다.", "success");
        }
      }

      // Alert 창 닫기 및 상태 초기화
      setMode({
        isMove: false,
        isDelete: false,
        checkItems: [],
      });
      setAlert((prev) => ({ ...prev, isVisible: false, ids: [] }));
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("삭제에 실패했습니다.", "error");
      }
    }
  };

  // withdrawal 타입에만 취소 버튼 표시 (withdrawalComplete는 더 이상 사용하지 않음)
  const showCancelButton = alert.type === "withdrawal";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/25 z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="px-6 rounded-2xl bg-[#f9faf9] w-full max-w-[404px] border border-gray-200 drop-shadow-lg"
      >
        <div className="flex flex-col items-center relative">
          <X
            className="absolute w-6 h-6 top-6 right-1 stroke-gray-700 hover:cursor-pointer hover:stroke-gray-900 transition-colors"
            onClick={() => setAlert((prev) => ({ ...prev, isVisible: false }))}
          />
          <p className="text-base font-normal mt-16 whitespace-pre-line text-center">
            {message}
          </p>
          <div className="flex gap-1 mt-8 mb-3 w-full">
            {showCancelButton && (
              <>
                <button
                  className="flex justify-center items-center w-[50%] h-[50px] px-6 py-4 rounded-lg text-gray-700 text-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() =>
                    setAlert((prev) => ({ ...prev, isVisible: false }))
                  }
                  disabled={isProcessing}
                >
                  취소
                </button>
                <div className="w-[2px] h-[50px] bg-gray-200"></div>
              </>
            )}
            <button
              className={`flex justify-center items-center ${
                showCancelButton ? "w-[50%]" : "w-full"
              } h-[50px] px-6 py-4 rounded-lg text-primary text-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleDelete}
              disabled={isProcessing}
            >
              {isProcessing && alert.type === "withdrawal" ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  처리 중...
                </div>
              ) : (
                "확인"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Alert;