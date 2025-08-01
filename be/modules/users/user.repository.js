import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Memo from "../../models/Memo.js";
import Tag from "../../models/Tag.js";

class UserRepository {
  constructor() {
    this.User = User;
    this.Category = Category;
    this.Memo = Memo;
    this.Tag = Tag;
  }

  // 사용자 조회
  async findUserByEmail(email) {
    return this.User.findOne({email});
  }

  async findUserById(userId) {
    return this.User.findById(userId);
  }

  async findUserByIdWithRefreshToken(id) {
    return User.findById(id).select("+refreshToken");
  }

  // 사용자 생성/업데이트
  async createUser(userData) {
    return this.User.create(userData);
  }

  async saveUser(user) {
    return user.save();
  }

  async updateOne(query, update) {
    return this.User.updateOne(query, update);
  }

  async deleteOne(query) {
    return this.User.deleteOne(query);
  }

  // 사용자 관련 데이터 삭제
  async deleteUserCategories(userId) {
    return this.Category.deleteMany({createdBy: userId});
  }

  async deleteUserMemos(userId) {
    return this.Memo.deleteMany({createdBy: userId});
  }

  async deleteUserMemoFavorites(userId) {
    return this.MemoFavorite.deleteMany({userId: userId});
  }
}

export default new UserRepository();
