import memoService from "./memo.service.js";
import asyncHandler from "express-async-handler";
import {MEMO_MESSAGES} from "../../constants/message.js";

class MemoController {
  constructor() {
    this.memoService = memoService;

    this.createMemo = asyncHandler(this.createMemo.bind(this));
    this.getMemoList = asyncHandler(this.getMemoList.bind(this));
    this.updateMemoFav = asyncHandler(this.updateMemoFav.bind(this));
    this.moveMemos = asyncHandler(this.moveMemos.bind(this));
    this.deleteMemos = asyncHandler(this.deleteMemos.bind(this));
    this.summarizeText = asyncHandler(this.summarizeText.bind(this));
    this.summarizeImage = asyncHandler(this.summarizeImage.bind(this));

    this.getMemoDetail = asyncHandler(this.getMemoDetail.bind(this));
    this.updateMemo = asyncHandler(this.updateMemo.bind(this));
    this.copyMemo = asyncHandler(this.copyMemo.bind(this));
    this.makeHashtags = asyncHandler(this.makeHashtags.bind(this));
    this.convertToVec = asyncHandler(this.convertToVec.bind(this));
  }

  // POST /api/memos
  async createMemo(req, res) {
    const {title, content, categoryId} = req.body;
    const createdBy = req.user.id;
    const data = {title, content, categoryId, createdBy};

    const newMemo = await this.memoService.createMemo(data);
    res.status(201).json({
      message: MEMO_MESSAGES.CREATE_SUCCESS,
      memo: newMemo,
    });
  }

  // GET /api/memos
  async getMemoList(req, res) {
    const createdBy = req.user.id;
    const {categoryId} = req.query;
    const data = {categoryId, createdBy};
    const memos = await this.memoService.getMemoList(data);
    res.status(200).json({
      message: MEMO_MESSAGES.GET_LIST_SUCCESS,
      memos: memos,
    });
  }

  // PATCH /api/memos/fav
  async updateMemoFav(req, res) {
    const {memoIds, isFavorite} = req.body;
    const createdBy = req.user.id;
    const data = {memoIds, createdBy, isFavorite};
    const memo = await this.memoService.updateMemosFav(data);
    res.status(200).json({
      message: isFavorite ? MEMO_MESSAGES.FAVORITE_ADD_SUCCESS : MEMO_MESSAGES.FAVORITE_REMOVE_SUCCESS,
      memo: memo,
    });
  }

  // PATCH /api/memos/move
  async moveMemos(req, res) {
    const {memoIds, categoryId} = req.body;
    const createdBy = req.user.id;
    const data = {memoIds, categoryId, createdBy};
    const memo = await this.memoService.moveMemos(data);
    res.status(200).json({
      message: MEMO_MESSAGES.MOVE_SUCCESS,
      memo: memo,
    });
  }

  // DELETE /api/memos
  async deleteMemos(req, res) {
    const {memoIds} = req.body;
    const createdBy = req.user.id;
    const data = {memoIds, createdBy};
    const memo = await this.memoService.deleteMemos(data);
    res.status(200).json({
      message: MEMO_MESSAGES.DELETE_SUCCESS,
      memo: memo,
    });
  }

  // GET /api/memos/:memoId
  async getMemoDetail(req, res) {
    const {memoId} = req.params;
    const createdBy = req.user.id;
    const data = {memoId, createdBy};
    const memo = await this.memoService.getMemoDetail(data);
    res.status(200).json({
      message: MEMO_MESSAGES.GET_SUCCESS,
      memo: memo,
    });
  }

  // PATCH /api/memos/:memoId
  async updateMemo(req, res) {
    const {memoId} = req.params;
    const {title, content} = req.body;
    const createdBy = req.user.id;
    const data = {memoId, title, content, createdBy};
    const memo = await this.memoService.updateMemo(data);
    res.status(200).json({
      message: MEMO_MESSAGES.UPDATE_SUCCESS,
      memo: memo,
    });
  }

  // POST /api/memos/:memoId/copy
  async copyMemo(req, res) {
    const {memoId} = req.params;
    const createdBy = req.user.id;
    const data = {memoId, createdBy};
    const memo = await this.memoService.copyMemo(data);
    res.status(201).json({
      message: MEMO_MESSAGES.COPY_SUCCESS,
      memo: memo,
    });
  }

  // POST /api/memos/:memoId/recommend-tags
  async makeHashtags(req, res) {
    const {memoId} = req.params;
    const memo = await this.memoService.makeHashtags(memoId);
    res.status(200).json({
      message: MEMO_MESSAGES.MAKE_HASHTAGS_SUCCESS,
      memo: memo,
    });
  }

  // POST /api/memos/:memoId/vectorize
  async convertToVec(req, res) {
    const {memoId} = req.params;
    const memo = await this.memoService.convertToVec(memoId);
    res.status(200).json({
      message: MEMO_MESSAGES.CONVERT_TO_VEC_SUCCESS,
      memo: memo,
    });
  }

  // POST /api/memos/ai-text
  async summarizeText(req, res) {
    const data = req.body;
    const result = await this.memoService.summarizeText(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_TEXT_SUCCESS,
      result: result,
    });
  }

  // POST /api/memos/ai-image
  async summarizeImage(req, res) {
    const data = req.body;
    const result = await this.memoService.summarizeImage(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_IMAGE_SUCCESS,
      result: result,
    });
  }
}

export default new MemoController();
