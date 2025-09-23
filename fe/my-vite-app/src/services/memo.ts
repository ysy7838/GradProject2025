// src/services/memoApi.ts
import api from "@/utils/api";

// API 응답 및 요청에 사용될 타입 정의
export interface Tag {
  _id: string;
  tagName: string;
}

export interface Memos {
  memoIds: string[];
}

export interface Memo {
  _id: string;
  categoryId: string;
  createdBy: string;
  title: string;
  content: string;
  isFavorite: boolean;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoRequest {
  title: string;
  content: string;
  categoryId?: string;
  tags?: string[]; // 태그 이름 배열로 요청
}

// 즐겨찾기 토글 API 응답 타입 정의
export interface FavoriteResponse {
  message: string;
  memo: {
    acknowledged: boolean;
    modifiedCount: number;
    upsertedId: string | null;
    upsertedCount: number;
    matchedCount: number;
  };
}

// 메모 상세 조회
export const getMemo = async (memoId: string): Promise<Memo> => {
  const response = await api.get(`/api/memos/${memoId}`);
  return response.data.memo;
};

// 메모 생성
export const createMemo = async (memoData: MemoRequest): Promise<Memo> => {
  const response = await api.post("/api/memos", memoData);
  return response.data.memo;
};

// 메모 수정
export const updateMemo = async (memoId: string, memoData: MemoRequest): Promise<Memo> => {
  const response = await api.patch(`/api/memos/${memoId}`, memoData);
  return response.data.memo;
};

export const toggleFavorite = async (memoIds: string[], isFavorite: boolean): Promise<FavoriteResponse> => {
  const response = await api.patch("/api/memos/fav", {memoIds, isFavorite});
  return response.data;
};

export const deleteMemo = async (memoIds: string[]): Promise<void> => {
  await api.delete("/api/memos/delete", {data: {memoIds}});
};

// 메모 태그 이름 추출
export const convertTagsToNames = (tags: Tag[] | undefined): string[] => {
  return tags?.map((tag) => tag.tagName) || [];
};

// 해시태그 추천
export const getRecommendedTags = async (memoId: string): Promise<string[]> => {
  const response = await api.get(`/api/memos/${memoId}/recommend-tags`);
  return response.data.tags;
};

// 관련 메모 추천
export const getRecommendedMemos = async (memoId: string): Promise<Memo[]> => {
  const response = await api.get(`/api/memos/${memoId}/recommend-memos`);
  return response.data.memos;
};

// 기타 API (필요 시 주석 해제하여 사용)
// export const copyMemo = async (memoId: string): Promise<Memo> => {
//   const response = await api.post(`/api/memos/${memoId}/copy`);
//   return response.data.memo;
// };