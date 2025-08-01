import mongoose from "mongoose";

const {Schema, Types} = mongoose;

const MemoSchema = new Schema(
  {
    categoryId: {type: Types.ObjectId, ref: "Category"},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {type: String, maxlength: 100},
    content: {type: String, default: ""}, // 마크다운
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    optimisticConcurrency: true, // 데이터 충돌 방지 활성화
  }
);

/* index */
MemoSchema.index({categoryId: 1, title: 1}, {collation: {locale: "ko", strength: 2}});
MemoSchema.index({categoryId: 1, createdAt: -1});
MemoSchema.index({categoryId: 1, updatedAt: -1});

const Memo = mongoose.model("Memo", MemoSchema, "memos");
export default Memo;
