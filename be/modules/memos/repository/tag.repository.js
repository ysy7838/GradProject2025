class TagRepository {
  constructor(Tag) {
    this.Tag = Tag;
  }

  // 태그 생성
  async create(tagData) {
    return this.Tag.create(tagData);
  }

  // 태그명으로 태그 찾기
  async findByTagName(tagName) {
    return this.Tag.findOne({tagName});
  }

  // 태그명 배열로 태그들 찾기
  async findByTagNames(tagNames) {
    return this.Tag.find({tagName: {$in: tagNames}});
  }

  // ID 배열로 태그들 찾기
  async findByIds(tagIds) {
    return this.Tag.find({_id: {$in: tagIds}});
  }

  // 사용 중인 모든 태그 조회
  async findAllActive() {
    return this.Tag.find({usageCount: {$gt: 0}}).sort({tagName: 1});
  }

  // 태그 사용 카운트 증가
  async incrementUsageCount(tagIds) {
    return this.Tag.updateMany({_id: {$in: tagIds}}, {$inc: {usageCount: 1}});
  }

  // 태그 사용 카운트 감소에 사용
  async bulkWrite(operations) {
    if (operations.length > 0) {
      return this.Tag.bulkWrite(operations);
    }
  }

  // 사용 카운트가 0 이하인 태그들 삭제
  async deleteUnusedTags() {
    return this.Tag.deleteMany({usageCount: {$lte: 0}});
  }

  // 태그 삭제
  async deleteById(tagId) {
    return this.Tag.findByIdAndDelete(tagId);
  }

  // 태그 업데이트
  async updateById(tagId, updateData) {
    return this.Tag.findByIdAndUpdate(tagId, updateData, {new: true});
  }
}

export default TagRepository;
