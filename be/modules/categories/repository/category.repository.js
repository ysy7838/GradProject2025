import mongoose from "mongoose";

class CategoryRepository {
  constructor(Category) {
    this.Category = Category;
  }

  // 생성
  async create(categoryData) {
    return this.Category.create(categoryData);
  }

  // 쿼리로 조회
  async findOneByQuery(query) {
    return this.Category.findOne(query).lean();
  }
  async findManyByQuery(query) {
    return this.Category.find(query).lean();
  }

  async exists(query) {
    return this.Category.exists(query).lean();
  }

  // 조회
  async findById(categoryId) {
    return this.Category.findById(categoryId).lean();
  }

  async findOneByUserIdAndCategoryId(categoryId, userId) {
    return this.Category.findOne({_id: categoryId, createdBy: userId}).lean();
  }

  async findManyByUserIdAndCategoryIds(categoryIds, userId) {
    return this.Category.find({_id: {$in: categoryIds}, createdBy: userId}).lean();
  }

  async findAll(userId) {
    return this.Category.find({createdBy: userId}).lean();
  }

  _toObjectId(id) {
    if (id === null) return null;
    if (mongoose.Types.ObjectId.isValid(id) && typeof id === "string") {
      return new mongoose.Types.ObjectId(id);
    }
    return id;
  }

  async findWithMemoCount(userId, parentCategoryId = null) {
    // 페이지네이션 후순위
    userId = this._toObjectId(userId);
    parentCategoryId = this._toObjectId(parentCategoryId);

    const pipeline = [
      ...(userId ? [{$match: {createdBy: userId}}] : []),
      {$match: {parentCategoryId: parentCategoryId}},
      {$sort: {order: 1}},
      {
        $lookup: {
          from: "memos",
          localField: "_id",
          foreignField: "categoryId",
          as: "memos",
        },
      },
      {
        $addFields: {
          memoCount: {$size: "$memos"},
        },
      },
      {
        $project: {
          memos: 0,
        },
      },
    ];
    const result = await this.Category.aggregate(pipeline).exec();
    return result;
  }

  // 수정
  async updateOne(filter, update, options = {new: true, runValidators: true}) {
    return this.Category.updateOne(filter, update, options).lean();
  }

  async updateMany(query, update, options) {
    return this.Category.updateMany(query, update, options);
  }

  // 삭제
  async deleteMany(query) {
    return this.Category.deleteMany(query);
  }
}

export default CategoryRepository;
