// src/components/auth/AccountRecoveryModal.tsx
import React from "react";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AccountRecoveryModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl p-8 mx-4 max-w-md w-full text-center"
      >
        {/* 성공 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          계정이 복구되었습니다
        </h3>

        {/* 설명 */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          탈퇴 요청하신 계정이 성공적으로 복구되었습니다.
          <br />
          이제 RefHub의 모든 기능을 다시 이용하실 수 있습니다.
        </p>

        {/* 확인 버튼 */}
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          확인
        </button>
      </motion.div>
    </div>
  );
};

export default AccountRecoveryModal;
