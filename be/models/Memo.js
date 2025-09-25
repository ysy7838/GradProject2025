import mongoose from "mongoose";

const {Schema, Types} = mongoose;

const MemoSchema = new Schema(
  {
    categoryId: {type: Types.ObjectId, ref: "Category"},
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {type: String, maxlength: 100},
    content: {type: String, default: ""}, // 마크다운
    isFavorite: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: Types.ObjectId,
        ref: "Tag",
      },
    ],
    // 이미지 필드 추가
    images: [
      {
        url: String,
        s3Key: String,
        summary: String,
        uploadedAt: Date,
        metadata: {
          size: Number,
          mimeType: String,
          originalName: String
        }
      }
    ]
  },
  {
    timestamps: true,
    versionKey: "__v",
    optimisticConcurrency: true,
  }
);

/* index */
MemoSchema.index({categoryId: 1, title: 1}, {collation: {locale: "ko", strength: 2}});
MemoSchema.index({categoryId: 1, createdAt: -1});
MemoSchema.index({categoryId: 1, updatedAt: -1});
MemoSchema.index({tags: 1});

const Memo = mongoose.model("Memo", MemoSchema, "memos");
export default Memo;
