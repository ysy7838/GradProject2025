// src/components/reference/FileUpload.tsx
import { useRef, useState } from "react";
import {
  Link,
  Image as ImageIcon,
  FileText,
  File as FileIcon,
  X,
  Plus,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/contexts/useToast";
import ImagePreviewModal from "./ImagePreviewModal";

interface FileItem {
  id: string;
  type: "link" | "image" | "pdf" | "file";
  content: string;
  name?: string;
  originalPath?: string; // 원본 파일 경로 저장 속성
}

interface FileContent {
  url: string;
  name?: string;
}

interface FileUploadProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function FileUpload({
  files,
  onChange,
  maxFiles = 5,
  disabled = false,
}: FileUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name?: string;
    downloadUrl?: string;
  } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 에러 상태 추가
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // 링크 유효성 검사 함수
  const validateLink = (url: string): boolean => {
    if (!url) return true; // 빈 링크는 다른 곳에서 검증
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const handleAddFileField = (type: "link" | "image" | "pdf" | "file") => {
    if (files.length >= maxFiles) {
      showToast(`최대 ${maxFiles}개까지만 추가할 수 있습니다.`, "error");
      return;
    }

    onChange([...files, { id: Date.now().toString(), type, content: "" }]);
  };

  const validateFile = (
    file: File,
    type: "image" | "pdf" | "file"
  ): boolean => {
    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast("20MB 이하 파일만 첨부 가능합니다.", "error");
      return false;
    }

    // 이미지 타입 검사
    if (type === "image") {
      const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      const fileName = file.name.toLowerCase();
      const fileExt = fileName.substring(fileName.lastIndexOf("."));

      if (
        !allowedImageExtensions.includes(fileExt) &&
        !allowedImageTypes.includes(file.type)
      ) {
        showToast(
          "JPG, PNG, GIF, WEBP 형식의 이미지만 첨부 가능합니다.",
          "error"
        );
        return false;
      }
    }

    // PDF 타입 검사
    if (type === "pdf") {
      const fileExt = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      if (fileExt !== ".pdf" && file.type !== "application/pdf") {
        showToast("PDF 형식의 파일만 첨부 가능합니다.", "error");
        return false;
      }
    }

    return true;
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLLabelElement>,
    index: number
  ) => {
    e.preventDefault();
    const { files: droppedFiles } = e.dataTransfer;
    if (droppedFiles.length === 0) return;

    const fileType = files[index].type;
    if (fileType === "link") return;

    handleFileUpload(droppedFiles, index);
  };

  const handleFileUpload = async (uploadedFiles: FileList, index: number) => {
    try {
      const fileType = files[index].type;
      const contents: FileContent[] = [];

      for (const file of Array.from(uploadedFiles)) {
        if (!validateFile(file, fileType as "image" | "pdf" | "file")) continue;

        const content = await readFileAsDataURL(file);
        contents.push(content);
      }

      if (contents.length > 0) {
        if (fileType === "image") {
          let existingImages: FileContent[] = [];

          // 기존 이미지 데이터 파싱
          if (files[index].content) {
            try {
              existingImages = JSON.parse(
                files[index].content
              ) as FileContent[];

              existingImages = existingImages.filter(
                (img) =>
                  img.url &&
                  (img.url.startsWith("data:") ||
                    img.url.startsWith("http://") ||
                    img.url.startsWith("https://"))
              );
            } catch (e) {
              console.error("JSON 파싱 실패", e);
              existingImages = [];
            }
          }

          const totalCount = existingImages.length + contents.length;
          if (totalCount > 5) {
            showToast("이미지는 최대 5개까지 첨부 가능합니다.", "error");
            contents.splice(5 - existingImages.length);
          }

          const updatedFiles = [...files];
          updatedFiles[index] = {
            ...files[index],
            content: JSON.stringify([...existingImages, ...contents]),
          };
          onChange(updatedFiles);
        } else {
          // 비이미지 파일은 첫 번째 파일만 사용
          const updatedFiles = [...files];
          updatedFiles[index] = {
            ...files[index],
            content: contents[0].url,
            name: contents[0].name,
          };
          onChange(updatedFiles);
        }
      }
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      showToast("파일 업로드에 실패했습니다.", "error");
    }
  };

  const readFileAsDataURL = (
    file: File
  ): Promise<{ url: string; name: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          url: reader.result as string,
          name: file.name,
        });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    await handleFileUpload(e.target.files!, index);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTypeChange = (index: number, newType: FileItem["type"]) => {
    const updatedFiles = [...files];
    updatedFiles[index] = {
      ...files[index],
      type: newType,
      content: "",
      name: undefined,
    };
    onChange(updatedFiles);
  };

  const getAcceptTypes = (type: FileItem["type"]) => {
    switch (type) {
      case "image":
        return ".jpg,.jpeg,.png,.gif,.webp";
      case "pdf":
        return ".pdf";
      case "file":
        return ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.pdf";
      default:
        return "";
    }
  };

  // 수정: 파일 삭제 함수 개선
  const handleRemoveFile = (index: number, imageIndex?: number) => {
    try {
      if (typeof imageIndex === "number" && files[index].type === "image") {
        // 이미지 리스트에서 특정 이미지 삭제
        const updatedFiles = [...files];
        try {
          // 원본 경로 보존
          const originalPath = updatedFiles[index].originalPath;

          // 이미지 파싱
          const images = JSON.parse(
            updatedFiles[index].content
          ) as FileContent[];
          console.log(`이미지 목록에서 삭제 - 이전:`, images.length);

          // 이미지 제거
          images.splice(imageIndex, 1);
          console.log(`삭제 후 남은 이미지:`, images.length);

          if (images.length === 0) {
            // 모든 이미지가 삭제된 경우 전체 파일 항목 삭제
            console.log(`모든 이미지 삭제됨. 파일 항목 제거`);
            onChange(files.filter((_, i) => i !== index));
          } else {
            // 이미지가 남아있는 경우 업데이트
            updatedFiles[index] = {
              ...updatedFiles[index],
              content: JSON.stringify(images),
              originalPath, // 원본 경로 유지
            };
            onChange(updatedFiles);
          }
        } catch (error) {
          console.error("이미지 데이터 파싱 오류:", error);
          showToast("이미지 삭제에 실패했습니다.", "error");
        }
      } else {
        // 전체 파일 항목 삭제 - stopPropagation 확인
        console.log(`파일 항목 삭제. 인덱스:`, index);
        onChange(files.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("파일 삭제 실패:", error);
      showToast("파일 삭제에 실패했습니다.", "error");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedFiles = [...files];
    const draggedFile = updatedFiles[draggedIndex];
    updatedFiles.splice(draggedIndex, 1);
    updatedFiles.splice(index, 0, draggedFile);

    onChange(updatedFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderFilePreview = (file: FileItem) => {
    if (file.type === "pdf") {
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <FileText className="w-8 h-8 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name ? decodeURIComponent(file.name) : "PDF 문서"}
            </p>
            <p className="text-xs text-gray-500">PDF 파일</p>
          </div>
        </div>
      );
    }

    if (file.type === "file") {
      return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <FileIcon className="w-8 h-8 text-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name ? decodeURIComponent(file.name) : "첨부 파일"}
            </p>
            <p className="text-xs text-gray-500">파일</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderUploadField = (file: FileItem, index: number) => {
    if (file.type === "link") {
      return (
        <div className="w-full">
          <input
            type="text"
            value={file.content}
            onChange={(e) => {
              const updatedFiles = [...files];
              updatedFiles[index] = { ...file, content: e.target.value };
              onChange(updatedFiles);

              // 사용자가 입력을 시작하면 오류 지우기
              if (validationErrors[`link-${index}`]) {
                const newErrors = { ...validationErrors };
                delete newErrors[`link-${index}`];
                setValidationErrors(newErrors);
              }
            }}
            onBlur={(e) => {
              // focus가 빠져나갈 때 유효성 검사
              if (e.target.value && !validateLink(e.target.value)) {
                setValidationErrors({
                  ...validationErrors,
                  [`link-${index}`]:
                    "http:// 또는 https://로 시작하는 링크를 입력해 주세요.",
                });
              }
            }}
            placeholder="링크를 입력해 주세요."
            className={`w-full h-[50px] px-5 py-[13px] border ${
              validationErrors[`link-${index}`]
                ? "border-red-500"
                : "border-gray-200"
            } rounded-lg focus:outline-none ${
              validationErrors[`link-${index}`]
                ? "focus:border-red-500"
                : "focus:border-[#62BA9B]"
            }`}
            disabled={disabled}
          />

          {/* 오류 메시지가 있을 때만 공간 추가 */}
          {validationErrors[`link-${index}`] && (
            <div className="h-6 mt-2">
              <p className="text-red-500 text-sm ml-1">
                http:// 또는 https://로 시작하는 링크를 입력해 주세요.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (file.type === "image" && file.content) {
      try {
        const images = JSON.parse(file.content) as FileContent[];
        console.log(
          `Rendering image list for index ${index}, images:`,
          images.length,
          "originalPath:",
          file.originalPath
        );
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {images.map((image, imageIndex) => (
                <div key={imageIndex} className="relative w-20 h-20 group">
                  <img
                    src={image.url}
                    alt={image.name || "Preview"}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    onClick={() =>
                      setPreviewImage({
                        url: image.url,
                        name: image.name || `image_${imageIndex + 1}.jpg`,
                        downloadUrl: image.url,
                      })
                    }
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // 이벤트 버블링 방지
                        console.log(
                          `Removing image at index ${imageIndex} from file at index ${index}`
                        );
                        handleRemoveFile(index, imageIndex);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              ))}
              {images.length < 5 && !disabled && (
                <label
                  className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-[#62BA9B] transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <input
                    type="file"
                    accept={getAcceptTypes(file.type)}
                    multiple={file.type === "image"}
                    className="hidden"
                    onChange={(e) => handleFileChange(e, index)}
                    disabled={disabled}
                  />
                  <Plus className="w-6 h-6 text-gray-400" />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-500">
              이미지는 최대 5개까지 첨부 가능합니다.
            </p>
          </div>
        );
      } catch (error) {
        console.error("이미지 렌더링 에러:", error, file.content);
        // 렌더링 오류 시에도 빈 이미지 리스트 표시하여 추가 가능하도록
        return (
          <div className="space-y-2">
            <p className="text-sm text-red-500">
              이미지 데이터 로드 오류, 다시 시도해주세요.
            </p>
            <div className="flex flex-wrap gap-2">
              <label
                className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-[#62BA9B] transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
              >
                <input
                  type="file"
                  accept={getAcceptTypes(file.type)}
                  multiple={file.type === "image"}
                  className="hidden"
                  onChange={(e) => handleFileChange(e, index)}
                  disabled={disabled}
                />
                <Plus className="w-6 h-6 text-gray-400" />
              </label>
            </div>
          </div>
        );
      }
    }

    return file.content ? (
      <div className="flex items-start gap-4">
        {renderFilePreview(file)}
        {!disabled && (
          <label
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:border-[#62BA9B] transition-colors cursor-pointer text-sm text-gray-600"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
          >
            <input
              type="file"
              accept={file.type === "pdf" ? ".pdf" : undefined}
              className="hidden"
              onChange={(e) => handleFileChange(e, index)}
              disabled={disabled}
            />
            파일 변경
          </label>
        )}
      </div>
    ) : (
      <label
        className={`flex-1 flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#62BA9B] transition-colors ${
          !disabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, index)}
      >
        <input
          type="file"
          accept={file.type === "pdf" ? ".pdf" : undefined}
          className="hidden"
          onChange={(e) => handleFileChange(e, index)}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Plus className="w-6 h-6" />
          <span>파일을 드래그하여 업로드하거나 클릭하여 선택하세요</span>
          <span className="text-sm text-gray-400">최대 20MB</span>
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      {/* File List */}
      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={file.id}
            draggable={!disabled}
            onDragStart={(e) => !disabled && handleDragStart(e, index)}
            onDragOver={(e) => !disabled && handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-start gap-4 p-4 bg-white border border-gray-100 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-lg hover:border-[#62BA9B] transition-colors ${
              draggedIndex === index ? "opacity-50" : ""
            } ${disabled ? "opacity-75" : ""}`}
            data-file-type={file.type}
            data-file-index={index}
          >
            {/* 드래그 핸들 + 타입 선택기를 감싸는 컨테이너 */}
            <div className="flex flex-col">
              <div className="flex gap-4 items-center">
                <GripVertical
                  className={`cursor-move text-gray-400 hover:text-gray-600 ${
                    disabled ? "opacity-50" : ""
                  }`}
                />

                {/* File Type Selector */}
                <div className="relative w-32">
                  <select
                    value={file.type}
                    onChange={(e) =>
                      handleTypeChange(
                        index,
                        e.target.value as FileItem["type"]
                      )
                    }
                    className={`w-full h-[50px] appearance-none bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-[#62BA9B] ${
                      disabled ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                    disabled={disabled}
                  >
                    <option value="link">링크</option>
                    <option value="image">이미지</option>
                    <option value="pdf">PDF</option>
                    <option value="file">파일</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 오류 메시지가 있을 때만 왼쪽에도 동일한 공간 추가 */}
              {file.type === "link" && validationErrors[`link-${index}`] && (
                <div className="h-6 mt-2 invisible">공간 유지용</div>
              )}
            </div>

            {/* File Content */}
            <div className="flex-1">{renderUploadField(file, index)}</div>

            {/* Remove Button - 수정: 클릭 이벤트 버블링 방지를 위해 stopPropagation 추가 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // 이벤트 버블링 방지
                handleRemoveFile(index);
              }}
              disabled={files.length === 1 || disabled}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:hover:text-gray-400 z-10"
              data-testid={`remove-file-${index}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add File Buttons */}
      {files.length < maxFiles && !disabled && (
        <div className="flex flex-col items-center gap-3">
          <p>자료 추가</p>
          <div className="flex gap-4 justify-center">
            {[
              { type: "link" as const, icon: Link, label: "링크" },
              { type: "image" as const, icon: ImageIcon, label: "이미지" },
              { type: "pdf" as const, icon: FileText, label: "PDF" },
              { type: "file" as const, icon: FileIcon, label: "파일" },
            ].map(({ type, icon: Icon, label }) => (
              <div
                key={type}
                className="flex flex-col items-center gap-2 hover:text-[#62BA9B] transition-colors"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // 이벤트 기본 동작 방지
                    handleAddFileField(type);
                  }}
                  className="p-5 bg-white rounded-full border border-gray-200 hover:border-[#62BA9B]"
                  disabled={disabled}
                >
                  <Icon className="w-6 h-5=6" />
                </button>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ""}
        imageName={previewImage?.name}
      />
    </div>
  );
}
