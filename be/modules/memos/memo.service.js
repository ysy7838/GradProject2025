import memoRepository from "./memo.repository.js";
import categoryService from "../categories/category.service.js";
import {NotFoundError} from "../../utils/customError.js";
import {MEMO_MESSAGES} from "../../constants/message.js";

class memoService {
  constructor(memoRepository, categoryService) {
    this.categoryService = categoryService;
    this.memoRepository = memoRepository;
  }

  async _getMemoAndCheckPermission(memoIdsOrId, createdBy) {
    let queryCondition;
    let memos;

    if (Array.isArray(memoIdsOrId)) {
      queryCondition = {_id: {$in: memoIdsOrId}, createdBy};
      memos = await this.memoRepository.find(queryCondition);
      if (memos.length !== memoIdsOrId.length) {
        throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
      }
    } else {
      queryCondition = {_id: memoIdsOrId, createdBy};
      memos = await this.memoRepository.findOne(queryCondition);
      if (!memos) {
        throw new NotFoundError(MEMO_MESSAGES.MEMO_NOT_FOUND_OR_NO_PERMISSION);
      }
    }
    return memos;
  }

  // 생성
  async createMemo(data) {
    const {title, content, categoryId, createdBy} = data;
    await this.categoryService.getCategoryAndCheckPermission(categoryId, createdBy);

    const dataToCreate = {title, content, categoryId, createdBy};
    const newMemo = await this.memoRepository.create(dataToCreate);
    return newMemo;
  }

  // 카테고리 내 메모 목록 조회
  async getMemoList(data) {
    const {categoryId, createdBy} = data;
    await this.categoryService.getCategoryAndCheckPermission(categoryId, createdBy);

    const filter = {categoryId, createdBy};
    const projection = {content: 0}; // content 필드 제외
    const memos = await this.memoRepository.find(filter, projection);
    return memos;
  }

  // 상세 조회
  async getMemoDetail(data) {
    const {memoId, createdBy} = data;
    return this._getMemoAndCheckPermission(memoId, createdBy);
  }

  // 메모 수정
  async updateMemo(data) {
    const {memoId, title, content, createdBy} = data;
    await this._getMemoAndCheckPermission(memoId, createdBy);

    const filter = {
      _id: memoId,
      createdBy: createdBy,
    };
    const update = {
      $set: {
        title: title,
        content: content,
      },
    };
    const updatedMemo = await this.memoRepository.updateOne(filter, update);
    return updatedMemo;
  }

  // 메모 즐겨찾기 추가/삭제
  async updateMemosFav(data) {
    const {memoIds, createdBy, isFavorite} = data;
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    const filter = {
      _id: {$in: memoIds},
      createdBy: createdBy,
    };
    const update = {
      $set: {
        isFavorite: isFavorite,
      },
    };
    const updatedMemos = await this.memoRepository.updateMany(filter, update);
    return updatedMemos;
  }

  // 메모 이동 (최소 1개)
  async moveMemos(data) {
    const {memoIds, categoryId, createdBy} = data;
    await this._getMemoAndCheckPermission(memoIds, createdBy);
    const filter = {
      _id: {$in: memoIds},
      createdBy: createdBy,
    };
    const update = {
      $set: {
        categoryId: categoryId,
      },
    };
    const updatedMemos = await this.memoRepository.updateMany(filter, update);
    return updatedMemos;
  }

  // 메모 복사
  async copyMemo(data) {
    const {memoId, createdBy} = data;
    const memo = await this._getMemoAndCheckPermission(memoId, createdBy);
    const title = memo.title + " copy";
    const {content, categoryId} = memo;
    const query = {title, content, categoryId, createdBy};
    const copiedMemo = await this.memoRepository.create(query);
    return copiedMemo;
  }

  // 메모 삭제 (최소 1개)
  async deleteMemos(data) {
    const {memoIds, createdBy} = data;
    await this._getMemoAndCheckPermission(memoIds, createdBy);

    const filter = {_id: {$in: memoIds}, createdBy};
    const memos = await this.memoRepository.deleteMany(filter);
    return memos;
  }

  // 해시태그 자동 생성 => 추가 필요
  async makeHashtags(memoId) {
    const query = {_id: memoId};
    const memo = await this.memoRepository.findOne(query);
    // TODO: 중간 처리 과정 필요
    // 조회 -> 처리
    return memo;
  }

  // 메모 벡터 변환
  async convertToVec(memoId) {
    const query = {_id: memoId};
    const memo = await this.memoRepository.findOne(query);
    // TODO: 중간 처리 과정 필요
    // 조회 -> 처리
    return memo;
  }

  // 요약
  async summarizeText(data) {
    // data 요약 과정
    const result = "";
    return result;
  }
  async summarizeImage(data) {
    // data 요약 과정
    const result = "";
    return result;
  }
}

export default new memoService(memoRepository, categoryService);
