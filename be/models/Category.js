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
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      maxLength: 6,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Index 설정
CategorySchema.index({createdBy: 1, title: 1});
CategorySchema.index({parentCategory: 1});
CategorySchema.index({parentCategory: 1, order: 1});

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema, "categories");

export default Category;
