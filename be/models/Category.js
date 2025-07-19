import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 50,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Index 설정
collSchema.index({createdBy: 1, title: 1});

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema, "categories");

export default Category;
