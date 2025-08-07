import Tag from "../../../models/Tag.js";

class TagRepository {
  // 태그 생성
  async create(tagData) {
    try {
      const tag = new Tag(tagData);
      return await tag.save();
    } catch (error) {
      throw error;
    }
  }

  // 태그명으로 태그 찾기
  async findByTagName(tagName) {
    try {
      return await Tag.findOne({ tagName });
    } catch (error) {
      throw error;
    }
  }

  // 태그명 배열로 태그들 찾기
  async findByTagNames(tagNames) {
    try {
      return await Tag.find({ tagName: { $in: tagNames } });
    } catch (error) {
      throw error;
    }
  }

  // ID 배열로 태그들 찾기
  async findByIds(tagIds) {
    try {
      return await Tag.find({ _id: { $in: tagIds } });
    } catch (error) {
      throw error;
    }
  }

  // 사용 중인 모든 태그 조회
  async findAllActive() {
    try {
      return await Tag.find({ usageCount: { $gt: 0 } }).sort({ tagName: 1 });
    } catch (error) {
      throw error;
    }
  }

  // 태그 사용 카운트 증가
  async incrementUsageCount(tagIds) {
    try {
      return await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      throw error;
    }
  }

  // 태그 사용 카운트 감소
  async decrementUsageCount(tagIds) {
    try {
      return await Tag.updateMany(
        { _id: { $in: tagIds } },
        { $inc: { usageCount: -1 } }
      );
    } catch (error) {
      throw error;
    }
  }

  // 사용 카운트가 0 이하인 태그들 삭제
  async deleteUnusedTags() {
    try {
      return await Tag.deleteMany({ usageCount: { $lte: 0 } });
    } catch (error) {
      throw error;
    }
  }

  // 태그 삭제
  async deleteById(tagId) {
    try {
      return await Tag.findByIdAndDelete(tagId);
    } catch (error) {
      throw error;
    }
  }

  // 태그 업데이트
  async updateById(tagId, updateData) {
    try {
      return await Tag.findByIdAndUpdate(tagId, updateData, { new: true });
    } catch (error) {
      throw error;
    }
  }
}

export default new TagRepository(); 