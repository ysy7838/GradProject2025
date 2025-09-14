// src/components/reference/ImagePreviewModal.tsx
import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/contexts/useToast";
import api from "@/utils/api";
import { referenceService } from "@/services/reference";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
  downloadUrl?: string;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  downloadUrl,
}: ImagePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState("");
  const [imageError, setImageError] = useState(false);

  const { showToast } = useToast();

  // URL handling logic
  useEffect(() => {
    const handleImageUrl = async () => {
      if (!imageUrl) {
        setDisplayUrl("");
        return;
      }

      try {
        // Handle data URLs (client-side files) directly
        if (imageUrl.startsWith("data:")) {
          setDisplayUrl(imageUrl);
          setImageError(false);
          return;
        }

        // Handle blob URLs (client-side files) directly
        if (imageUrl.startsWith("blob:")) {
          setDisplayUrl(imageUrl);
          setImageError(false);
          return;
        }

        // For remote URLs, use the transformation service
        const url = await referenceService.transformUrl(imageUrl);
        setDisplayUrl(url);
        setImageError(false);
      } catch (error) {
        console.error("이미지 URL 처리 실패:", error);
        setImageError(true);
        setDisplayUrl("/images/placeholder.svg");
      }
    };

    if (isOpen && imageUrl) {
      handleImageUrl();
    }
  }, [imageUrl, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDisplayUrl("");
      setImageError(false);
    }
  }, [isOpen]);

  const isPdf =
    imageUrl.toLowerCase().includes("-preview.png") &&
    downloadUrl?.toLowerCase().includes(".pdf");

  const handleDownload = async () => {
    if (!downloadUrl) return;

    try {
      setIsDownloading(true);

      // If it's a blob/data URL (client-side file), create a download from it directly
      if (downloadUrl.startsWith("blob:") || downloadUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", imageName || "image");
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast("다운로드가 완료되었습니다.", "success");
        setIsDownloading(false);
        return;
      }

      // Handle remote URLs
      // Split comma-separated URLs and use the first one
      let urlToDownload = downloadUrl;
      if (downloadUrl.includes(",")) {
        const urls = downloadUrl.split(",").map((url) => url.trim());

        // Try to find a matching URL based on preview filename
        const previewFileName = imageUrl
          .split("/")
          .pop()
          ?.replace("-preview.png", "");

        if (previewFileName) {
          const matchingUrl = urls.find((url) =>
            url.includes(previewFileName.split("-").pop() || "")
          );
          urlToDownload = matchingUrl || urls[0];
        } else {
          urlToDownload = urls[0];
        }
      }

      // API download endpoint for remote files
      const response = await api.get(`/api/references/download`, {
        params: { fileUrl: urlToDownload },
        responseType: "blob",
      });

      // Create a download from the response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set filename from metadata or derive from URL
      let fileName = imageName || (isPdf ? "document.pdf" : "image");
      if (fileName.includes("-preview.png")) {
        fileName = fileName.replace("-preview.png", "");
      }

      // Decode URL-encoded filenames
      try {
        if (fileName.includes("%")) {
          fileName = decodeURIComponent(fileName);
        }
      } catch (e) {
        console.error("파일명 디코딩 오류:", e);
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("다운로드가 완료되었습니다.", "success");
    } catch (error) {
      console.error("다운로드 실패:", error);
      showToast("다운로드에 실패했습니다.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl w-full mx-4 p-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 pr-8">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {isPdf ? (
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
            {imageName && (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {imageName.includes("%")
                  ? decodeURIComponent(imageName)
                  : imageName}
              </h3>
            )}
          </div>
          {downloadUrl && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 py-1.5 ml-4 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors ${
                isDownloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "다운로드 중..." : "다운로드"}</span>
            </button>
          )}
        </div>
        <div
          className="relative w-full bg-gray-100 rounded-lg"
          style={{ paddingTop: "75%" }}
        >
          {imageError ? (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-500">
              이미지를 로드하는 데 실패했습니다.
            </div>
          ) : (
            <img
              src={displayUrl || "/images/placeholder.svg"}
              alt={
                imageName?.includes("%")
                  ? decodeURIComponent(imageName)
                  : imageName || "Preview"
              }
              className="absolute top-0 left-0 w-full h-full object-contain p-2"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <p className="text-sm text-gray-500 text-center">
          {isPdf
            ? "PDF 미리보기입니다. 원본 파일을 보려면 다운로드하세요."
            : "이미지 미리보기"}
        </p>
      </div>
    </Modal>
  );
}
