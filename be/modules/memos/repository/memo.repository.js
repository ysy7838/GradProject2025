class UserRepository {
  constructor(Memo) {
    this.Memo = Memo;
  }

  // 생성
  async create(data) {
    return this.Memo.create(data);
  }

  // 조회
  async findById(id) {
    return this.Memo.findById(id).populate("tags", "_id tagName").lean();
  }
  async findOne(filter) {
    return this.Memo.findOne(filter).populate("tags", "_id tagName").lean();
  }
  async find(filter, projection = null, options = {}) {
    let dbQuery = this.Memo.find(filter);

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
    dbQuery = dbQuery.populate("tags", "_id tagName");

    // TODO: select, populate 등 필요한 다른 Mongoose 쿼리 옵션 추가 가능

    return dbQuery.lean();
  }

  // 수정
  async updateOne(filter, update, options = {new: true, runValidators: true}) {
    return this.Memo.findOneAndUpdate(filter, update, options).populate("tags", "_id tagName").lean();
  }
  async updateMany(filter, update, options = {}) {
    return this.Memo.updateMany(filter, update, options);
  }

  // 해시태그 자동 생성 => 추가 필요
  // elastic search || vector db 사용

  // 메모 벡터 변환
  // elastic search || vector db 사용

  // 삭제
  async deleteOne(filter) {
    return this.Memo.findOneAndDelete(filter).lean();
  }
  async deleteMany(filter) {
    return this.Memo.deleteMany(filter);
  }
}

export default UserRepository;
