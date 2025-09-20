import asyncHandler from "express-async-handler";
import {MEMO_MESSAGES} from "../../../constants/message.js";
import multer from "multer";

class MemoController {
  constructor(memoService) {
    this.memoService = memoService;

    // 기존 메서드들...
    this.createMemo = asyncHandler(this.createMemo.bind(this));
    this.getMemoList = asyncHandler(this.getMemoList.bind(this));
    this.updateMemoFav = asyncHandler(this.updateMemoFav.bind(this));
    this.moveMemos = asyncHandler(this.moveMemos.bind(this));
    this.deleteMemos = asyncHandler(this.deleteMemos.bind(this));

    // 간소화된 요약 메서드들
    this.summarizeText = asyncHandler(this.summarizeText.bind(this));
    this.summarizeImage = asyncHandler(this.summarizeImage.bind(this));
    this.summarizeMemoText = asyncHandler(this.summarizeMemoText.bind(this));
    this.summarizeMultipleImages = asyncHandler(this.summarizeMultipleImages.bind(this));
    this.summarizeImageUpload = asyncHandler(this.summarizeImageUpload.bind(this));

    // 기타 기존 메서드들...
    this.getMemoDetail = asyncHandler(this.getMemoDetail.bind(this));
    this.updateMemo = asyncHandler(this.updateMemo.bind(this));
    this.copyMemo = asyncHandler(this.copyMemo.bind(this));
    this.makeHashtags = asyncHandler(this.makeHashtags.bind(this));
    this.convertToVec = asyncHandler(this.convertToVec.bind(this));
  }

  // 기존 메서드들은 그대로 유지...

  /**
   * POST /api/memos/ai/text
   * 텍스트 요약
   */
  async summarizeText(req, res) {
    const { content } = req.body;
    const data = { content };
    const result = await this.memoService.summarizeText(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_TEXT_SUCCESS,
      result: result,
    });
  }

  /**
   * POST /api/memos/ai/image
   * 이미지 요약 (단일 이미지)
   */
  async summarizeImage(req, res) {
    const { imageData } = req.body;
    const data = { imageData };
    const result = await this.memoService.summarizeImage(data);
    res.status(200).json({
      message: MEMO_MESSAGES.SUMMARIZE_IMAGE_SUCCESS,
      result: result,
    });
  }

  /**
   * POST /api/memos/:memoId/ai/text
   * 특정 메모의 텍스트 요약
   */
  async summarizeMemoText(req, res) {
    const { memoId } = req.params;
    const createdBy = req.user.id;
    const data = { memoId, createdBy };
    const result = await this.memoService.summarizeMemoText(data);
    res.status(200).json({
      message: "메모 텍스트 요약이 성공적으로 생성되었습니다.",
      result: result,
    });
  }

  /**
   * POST /api/memos/ai/images
   * 다중 이미지 요약
   */
  async summarizeMultipleImages(req, res) {
    const { imageDataArray } = req.body;
    const data = { imageDataArray };
    const result = await this.memoService.summarizeMultipleImages(data);
    res.status(200).json({
      message: "다중 이미지 요약이 성공적으로 생성되었습니다.",
      result: result,
    });
  }

  // 파일 업로드를 통한 이미지 요약 (multipart/form-data)
  /**
   * POST /api/memos/ai/image/upload
   * 파일 업로드를 통한 이미지 요약
   */
  async summarizeImageUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "이미지 파일이 제공되지 않았습니다."
        });
      }

      // 업로드된 파일을 base64로 변환
      const imageData = {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      };

      const data = { imageData };
      const result = await this.memoService.summarizeImage(data);
      res.status(200).json({
        message: MEMO_MESSAGES.SUMMARIZE_IMAGE_SUCCESS,
        result: result,
      });

    } catch (error) {
      console.error("Image upload summarization error:", error);
      res.status(500).json({
        error: "이미지 업로드 요약 중 오류가 발생했습니다."
      });
    }
  }

  // 기존 메서드들...
  async createMemo(req, res) {
    const {title, content, categoryId, tags} = req.body;
    const createdBy = req.user.id;
    const data = {title, content, categoryId, createdBy, tags};

    const newMemo = await this.memoService.createMemo(data);
    res.status(201).json({
      message: MEMO_MESSAGES.CREATE_SUCCESS,
      memo: newMemo,
    });
  }

  async getMemoList(req, res) {
    const createdBy = req.user.id;
    const {categoryId} = req.query;
    const data = {categoryId, createdBy};
    const memos = await this.memoService.getMemoList(data);
    res.status(200).json({
      message: MEMO_MESSAGES.GET_LIST_SUCCESS,
      count: memos.length,
      memos: memos,
    });
  }

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
    const {memoIds} = req.body;
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
    const {title, content, tags} = req.body;
    const createdBy = req.user.id;
    const data = {memoId, title, content, createdBy, tags};
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
}

export default MemoController;