class UserRepository {
  constructor(User, Category, Memo) {
    this.User = User;
    this.Category = Category;
    this.Memo = Memo;
  }

  // 생성
  async create(data) {
    return this.User.create(data);
  }

  // 조회 (lean - 읽기 전용)
  async findById(id) {
    return this.User.findById(id).lean();
  }

  async findOne(filter) {
    return this.User.findOne(filter).lean();
  }

  // 조회 (Mongoose Document - 수정 가능)
  async findOneForUpdate(filter) {
    return this.User.findOne(filter);
  }

  async findByIdForUpdate(id) {
    return this.User.findById(id);
  }

  async find(filter, projection = null, options = {}) {
    let dbQuery = this.User.find(filter);

    if (projection) {
      dbQuery = dbQuery.select(projection);
    }
    if (options.sort) {
      dbQuery = dbQuery.sort(options.sort);
    }
    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit);
    }
    if (options.skip) {
      dbQuery = dbQuery.skip(options.skip);
    }

    return dbQuery.lean();
  }

  // 수정
  async updateOne(filter, update, options = {new: true, runValidators: true}) {
    return this.User.findOneAndUpdate(filter, update, options).lean();
  }

  async updateMany(filter, update, options = {}) {
    return this.User.updateMany(filter, update, options);
  }

  // 삭제
  async deleteOne(filter) {
    return this.User.findOneAndDelete(filter).lean();
  }

  async deleteMany(filter) {
    return this.User.deleteMany(filter);
  }

  // 특별한 케이스만 유지
  async findUserByIdWithRefreshToken(id) {
    return this.User.findById(id).select("+refreshToken");
  }

  async saveUser(user) {
    return user.save();
  }

  // 사용자 관련 데이터 삭제
  async deleteUserCategories(userId) {
    return this.Category.deleteMany({createdBy: userId});
  }

  async deleteUserMemos(userId) {
    return this.Memo.deleteMany({createdBy: userId});
  }
}

export default UserRepository;
