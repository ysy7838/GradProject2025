import tagRepository from "../repository/tag.repository.js";
import CustomError from "../../../utils/customError.js";

class TagService {
  constructor(tagRepository) {
    this.tagRepository = tagRepository;
  }

  // 태그 생성 또는 기존 태그 반환
  async findOrCreateTag(tagName) {
    try {
      const normalizedTagName = tagName.trim().toLowerCase();
      
      let tag = await this.tagRepository.findByTagName(normalizedTagName);
      
      if (!tag) {
        tag = await this.tagRepository.create({ tagName: normalizedTagName });
      }
      
      return tag;
    } catch (error) {
      throw new CustomError("태그 처리 중 오류가 발생했습니다.", 500);
    }
  }

  // 태그 사용 카운트 증가
  async incrementTagUsage(tagIds) {
    try {
      if (!tagIds || tagIds.length === 0) return;
      
      await this.tagRepository.incrementUsageCount(tagIds);
    } catch (error) {
      throw new CustomError("태그 사용 카운트 증가 중 오류가 발생했습니다.", 500);
    }
  }

  // 태그 사용 카운트 감소
  async decrementTagUsage(tagIds) {
    try {
      if (!tagIds || tagIds.length === 0) return;
      
      // 사용 카운트 감소
      await this.tagRepository.decrementUsageCount(tagIds);
      
      // 사용 카운트가 0인 태그들 삭제
      await this.tagRepository.deleteUnusedTags();
    } catch (error) {
      throw new CustomError("태그 사용 카운트 감소 중 오류가 발생했습니다.", 500);
    }
  }

  // 태그 이름으로 태그 찾기
  async findTagsByNames(tagNames) {
    try {
      const normalizedTagNames = tagNames.map(name => name.trim().toLowerCase());
      return await this.tagRepository.findByTagNames(normalizedTagNames);
    } catch (error) {
      throw new CustomError("태그 검색 중 오류가 발생했습니다.", 500);
    }
  }

  // 모든 태그 조회
  async getAllTags() {
    try {
      return await this.tagRepository.findAllActive();
    } catch (error) {
      throw new CustomError("태그 조회 중 오류가 발생했습니다.", 500);
    }
  }

  // 특정 태그로 메모 검색을 위한 태그 ID 찾기
  async getTagIdByName(tagName) {
    try {
      const normalizedTagName = tagName.trim().toLowerCase();
      const tag = await this.tagRepository.findByTagName(normalizedTagName);
      return tag ? tag._id : null;
    } catch (error) {
      throw new CustomError("태그 ID 검색 중 오류가 발생했습니다.", 500);
    }
  }
}

export default new TagService(tagRepository); 