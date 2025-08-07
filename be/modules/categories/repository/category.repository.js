import mongoose from "mongoose";
import Category from "../../../models/Category.js";

class CategoryRepository {
  constructor() {
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

  async findExistingTitle(title, userId, excludeCategoryId = null) {
    const query = {title, createdBy: userId};
    if (excludeCategoryId) {
      query._id = {$ne: excludeCategoryId};
    }
    return this.Category.exists(query);
  }

  async findMaxOrder(userId, parentCategoryId = null) {
    const result = await this.Category.aggregate([
      {
        $match: {
          parentCategoryId: parentCategoryId,
          createdBy: userId,
        },
      },
      {
        $group: {
          _id: null,
          maxOrder: {$max: "$order"},
        },
      },
    ]);
    return result.length > 0 ? result[0].maxOrder : -1;
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
  async findOneAndUpdate(query, update, options) {
    return this.Category.findOneAndUpdate(query, update, options);
  }

  async updateMany(query, update, options) {
    return this.Category.updateMany(query, update, options);
  }

  async updateManyOrders(updates) {
    // updates [{ _id: categoryId1, order: newOrder1 }, { _id: categoryId2, order: newOrder2 }, ...] 형태
    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: {_id: item._id},
        update: {$set: {order: item.order}},
      },
    }));
    return this.Category.bulkWrite(bulkOps);
  }

  // 삭제
  async deleteMany(query) {
    return this.Category.deleteMany(query);
  }
}

export default new CategoryRepository();
