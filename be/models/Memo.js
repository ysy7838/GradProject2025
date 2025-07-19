import mongoose from "mongoose";

const {Schema, Types} = mongoose;

/* 메모 저장 */
const MemoSchema = new Schema(
  {
    categoryId: {type: Types.ObjectId, ref: "Category", required: true},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {type: String, required: true, maxlength: 100},
    content: {type: String, default: ""}, // 마크다운 문자열로 저장
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 생성
    versionKey: "__v", // 낙관적 락을 위한 버전 키
    optimisticConcurrency: true, // 데이터 충돌 방지 활성화
  }
);

/* index */
MemoSchema.index({categoryId: 1, title: 1}, {collation: {locale: "ko", strength: 2}});
MemoSchema.index({categoryId: 1, createdAt: -1});
MemoSchema.index({categoryId: 1, updatedAt: -1});

const Memo = mongoose.model("Memo", MemoSchema, "memos");
export default Memo;