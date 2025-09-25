import asyncHandler from "express-async-handler";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import multer from "multer";

class MemoController {
  constructor(memoService, fileService) {
    this.memoService = memoService;
    this.fileService = fileService;

    this.createMemo = asyncHandler(this.createMemo.bind(this));
    this.getMemoList = asyncHandler(this.getMemoList.bind(this));
    this.searchMemos = asyncHandler(this.searchMemos.bind(this));
    this.updateMemoFav = asyncHandler(this.updateMemoFav.bind(this));
    this.moveMemos = asyncHandler(this.moveMemos.bind(this));
    this.deleteMemos = asyncHandler(this.deleteMemos.bind(this));

    this.summarizeText = asyncHandler(this.summarizeText.bind(this));
    this.summarizeImage = asyncHandler(this.summarizeImage.bind(this));
    this.summarizeMemoText = asyncHandler(this.summarizeMemoText.bind(this));
    this.summarizeMultipleImages = asyncHandler(this.summarizeMultipleImages.bind(this));
    this.summarizeImageUpload = asyncHandler(this.summarizeImageUpload.bind(this));

    this.getMemoDetail = asyncHandler(this.getMemoDetail.bind(this));
    this.updateMemo = asyncHandler(this.updateMemo.bind(this));
    this.copyMemo = asyncHandler(this.copyMemo.bind(this));
    this.makeHashtags = asyncHandler(this.makeHashtags.bind(this));
    this.convertToVec = asyncHandler(this.convertToVec.bind(this));
    this.recommendMemos = asyncHandler(this.recommendMemos.bind(this));
  }

  /* POST /api/memos/ai/text :텍스트 요약 */
  async summarizeText(req, res) {
    const {content} = req.body;
    const data = {content};
    const result = await this.memoService.summarizeText(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_TEXT_SUCCESS,
      result: result,
    });
  }

  /* POST /api/memos/ai/image :이미지 요약 (단일 이미지) */
  async summarizeImage(req, res) {
    const {imageData} = req.body;
    const data = {imageData};
    const result = await this.memoService.summarizeImage(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_IMAGE_SUCCESS,
      result: result,
    });
  }

  /* POST /api/memos/:memoId/ai/text :텍스트 및 이미지 통합요약 */
  async summarizeMemoText(req, res) {
    const {memoId} = req.params;
    const createdBy = req.user.id;
    const data = {memoId, createdBy};
    const result = await this.memoService.summarizeMemoText(data);
    res.status(200).json({
      message: "메모 텍스트 요약이 성공적으로 생성되었습니다.",
      result: result,
    });
  }

  /* POST /api/memos/ai/images :다중 이미지 요약 */
  async summarizeMultipleImages(req, res) {
    const {imageDataArray} = req.body;
    const data = {imageDataArray};
    const result = await this.memoService.summarizeMultipleImages(data);
    res.status(200).json({
      message: "다중 이미지 요약이 성공적으로 생성되었습니다.",
      result: result,
    });
  }

  /* POST /api/memos/ai/image/upload: 이미지를 S3에 업로드하고 요약 생성 */
  async summarizeImageUpload(req, res) {
    if (!req.file) {
      return res.status(400).json({
        error: "이미지 파일이 제공되지 않았습니다.",
      });
    }
    const {memoId} = req.body; // 메모 ID (선택적)
    const createdBy = req.user.id;
    const file = req.file;
    const data = {file, createdBy, memoId};
    const result = await this.memoService.summarizeImageWithS3(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_IMAGE_SUCCESS,
      result: result,
    });
  }
}

  async createMemo(req, res) {
    const {title, content, categoryId, tags, images} = req.body;
    const createdBy = req.user.id;
    const data = {title, content, categoryId, createdBy, tags, images};

    const newMemo = await this.memoService.createMemo(data);
    res.status(201).json({
      message: MEMO_MESSAGES.CREATE_SUCCESS,
      memo: newMemo,
    });
  }

  async getMemoList(req, res) {
    const createdBy = req.user.id;
    const {categoryId, sortKey, sortOrder} = req.query;
    const data = {categoryId, createdBy, sortKey, sortOrder};
    const memos = await this.memoService.getMemoList(data);
    res.status(200).json({
      message: MEMO_MESSAGES.GET_LIST_SUCCESS,
      count: memos.length,
      memos: memos,
    });
  }

  // GET /api/memos/search
  async searchMemos(req, res) {
    const createdBy = req.user.id;
    const {q, isFuzzy} = req.query;
    const data = {q, isFuzzy, createdBy};
    const memos = await this.memoService.searchMemos(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SEARCH_SUCCESS,
      count: memos.length,
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

  async deleteMemos(req, res) {
    const memoIds = req.query.memoIds ? req.query.memoIds.split(",") : [];
    const createdBy = req.user.id;
    const data = {memoIds, createdBy};
    const memo = await this.memoService.deleteMemos(data);
    res.status(200).json({
      message: MEMO_MESSAGES.DELETE_SUCCESS,
      memo: memo,
    });
  }

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

  async updateMemo(req, res) {
    const {memoId} = req.params;
    const {title, content, tags, images} = req.body;
    const createdBy = req.user.id;
    const data = {memoId, title, content, createdBy, tags, images};
    const memo = await this.memoService.updateMemo(data);
    res.status(200).json({
      message: MEMO_MESSAGES.UPDATE_SUCCESS,
      memo: memo,
    });
  }

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

  async makeHashtags(req, res) {
    const {memoId} = req.params;
    const memo = await this.memoService.makeHashtags(memoId);
    res.status(200).json({
      message: MEMO_MESSAGES.MAKE_HASHTAGS_SUCCESS,
      memo: memo,
    });
  }

  async convertToVec(req, res) {
    const {memoId} = req.body;
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

  async recommendMemos(req, res) {
    const {memoId} = req.params;
    const createdBy = req.user.id;
    const data = {memoId, createdBy};
    const memos = await this.memoService.recommendMemos(data);
    res.status(200).json({
      message: MEMO_MESSAGES.RECOMMEND_MEMOS_SUCCESS,
      count: memos.length,
      memos: memos,
    });
  }
}

export default MemoController;
