import mongoose from "mongoose";

const FavSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    memoId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Memo",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {versionKey: false}
);

FavSchema.index({memoId: 1, userId: 1}, {unique: true});

const MemoFavorite = mongoose.models.MemoFavorite || mongoose.model("MemoFavorite", FavSchema, "memoFavorites");
// 모델 이름, 스키마 객체, 실제 DB 컬렉션 이름

export default MemoFavorite;
