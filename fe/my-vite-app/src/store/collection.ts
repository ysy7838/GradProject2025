import { atom } from "recoil";
import { CollectionResponse } from "@/types/collection";

interface ModalState {
  type: string;
  isOpen: boolean;
  id: string;
  title: string;
}

interface ShareModalState {
  isOpen: boolean;
  collectionId: string;
}

interface DropdownState {
  sortType: string;
  searchType: string;
  searchWord: string;
  collections: string[];
}

export interface FloatingState {
  isMove: boolean;
  isDelete: boolean;
  checkItems: string[];
}

interface AlertState {
  type: string; // 여기에 "withdrawal"(회원탈퇴) 타입을 사용할 예정
  massage: string;
  ids: string[];
  isVisible: boolean;
  title: string;
}

// 초기 상태 상수 정의
const initialCollectionState: CollectionResponse = {
  currentPage: 1,
  totalPages: 1,
  totalItemCount: 0,
  _id: "",
  title: "",
  isShared: false,
  isFavorite: false,
  refCount: 0,
  previewImages: [],
  data: [],
};

export const modalState = atom<ModalState>({
  key: "modalState",
  default: {
    type: "",
    isOpen: false,
    id: "",
    title: "",
  },
});

export const shareModalState = atom<ShareModalState>({
  key: "shareModalState",
  default: { isOpen: false, collectionId: "" },
});

export const DropState = atom<DropdownState>({
  key: "DropdownState",
  default: {
    sortType: "latest",
    searchType: "all",
    searchWord: "",
    collections: [],
  },
});

export const floatingModeState = atom<FloatingState>({
  key: "floatingState",
  default: {
    isMove: false,
    isDelete: false,
    checkItems: [],
  },
});

export const collectionState = atom<CollectionResponse>({
  key: "collectionState",
  default: initialCollectionState,
});

export const alertState = atom<AlertState>({
  key: "alertState",
  default: {
    type: "collection",
    massage: "",
    ids: [],
    isVisible: false,
    title: "", // 현재 코드의 title 필드 유지
  },
});
