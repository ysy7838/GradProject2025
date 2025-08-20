import {CustomError} from "../../../utils/customError.js";

class TagService {
  constructor(tagRepository) {
    this.tagRepository = tagRepository;
  }

  // 태그 생성 또는 기존 태그 반환
  async findOrCreateTag(tagName) {
    const normalizedTagName = tagName.trim().toLowerCase();
    let tag = await this.tagRepository.findByTagName(normalizedTagName);
    if (!tag) {
      tag = await this.tagRepository.create({tagName: normalizedTagName});
    }

    return tag;
  }

  // 태그 사용 카운트 증가
  async incrementTagUsage(tagIds) {
    if (!tagIds || tagIds.length === 0) return;

    await this.tagRepository.incrementUsageCount(tagIds);
  }

  // 태그 사용 카운트 감소
  async decrementTagUsage(tagIds) {
    if (!tagIds || tagIds.length === 0) return;

    const tagCounts = {};
    tagIds.forEach((tagIdStr) => {
      tagCounts[tagIdStr] = (tagCounts[tagIdStr] || 0) + 1;
    });

    const operations = Object.entries(tagCounts).map(([tagId, count]) => ({
      updateOne: {
        filter: {_id: tagId},
        update: {$inc: {usageCount: -count}},
      },
    }));

    if (operations.length > 0) {
      await this.tagRepository.bulkWrite(operations);
    }

    await this.tagRepository.deleteUnusedTags();
  }

  // tagRepository의 bulkWrite 함수 추가
  async bulkWrite(operations) {
    try {
      if (operations.length > 0) {
        return await Tag.bulkWrite(operations);
      }
    } catch (error) {
      throw error;
    }
  }

  // 태그 이름으로 태그 찾기
  async findTagsByNames(tagNames) {
    const normalizedTagNames = tagNames.map((name) => name.trim().toLowerCase());
    return await this.tagRepository.findByTagNames(normalizedTagNames);
  }

  // 모든 태그 조회
  async getAllTags() {
    return await this.tagRepository.findAllActive();
  }

  // 특정 태그로 메모 검색을 위한 태그 ID 찾기
  async getTagIdByName(tagName) {
    const normalizedTagName = tagName.trim().toLowerCase();
    const tag = await this.tagRepository.findByTagName(normalizedTagName);
    return tag ? tag._id : null;
  }
}

export default TagService;