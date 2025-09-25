import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExternalServiceError, BadRequestError } from "../../../utils/customError.js";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    this.visionModel = this.genAI.getGenerativeModel({model: "gemini-2.5-flash-lite"});
  }

  /**
   * HTML 텍스트를 평문으로 변환
   */
  async _convertHtmlToText(htmlContent) {
    if (!htmlContent) {
      return "";
    }
    try {
      const plainText = htmlToText(htmlContent, {
        wordwrap: false,
        ignoreImage: true,
        ignoreHref: true,
      });
      return plainText.trim();
    } catch (error) {
      console.error("HTML conversion error:", error);
      return htmlContent;
    }
  }

  /**
   * 텍스트 길이 검증
   */
  _validateTextLength(text) {
    const minLength = 10; // 최소 10자
    const maxLength = 30000; // 최대 30,000자

    if (text.length < minLength) {
      throw new BadRequestError(`요약할 텍스트가 너무 짧습니다. 최소 ${minLength}자 이상이어야 합니다.`);
    }
    
    if (text.length > maxLength) {
      throw new BadRequestError(`요약할 텍스트가 너무 깁니다. 최대 ${maxLength}자까지 가능합니다.`);
    }
  }

  /**
   * 텍스트 요약 생성
   */
  async summarizeText(content) {
    try {
      // 마크다운을 평문으로 변환 (async로 변경)
      const plainText = await this._convertHtmlToText(content);
      
      // 텍스트 길이 검증
      this._validateTextLength(plainText);

      // 요약 프롬프트 생성
      const prompt = this._generateTextPrompt(plainText);

      // Gemini API 호출
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return {
        summary: summary.trim(),
        originalLength: plainText.length,
        summaryLength: summary.trim().length,
        type: "text",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("Gemini text summarization error:", error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      // Gemini API 에러 처리
      if (error.message?.includes('API_KEY')) {
        throw new ExternalServiceError("Gemini API 키가 설정되지 않았습니다.");
      }
      
      if (error.message?.includes('quota')) {
        throw new ExternalServiceError("Gemini API 할당량을 초과했습니다.");
      }
      
      throw new ExternalServiceError("텍스트 요약 중 오류가 발생했습니다.");
    }
  }

  /**
   * 이미지 요약 생성
   */
  async summarizeImage(imageData) {
    try {
      // 이미지 데이터 검증
      if (!imageData || !imageData.data) {
        throw new BadRequestError("이미지 데이터가 제공되지 않았습니다.");
      }

      // 프롬프트 생성
      const prompt = this._generateImagePrompt();

      // 이미지 객체 준비
      const imagePart = {
        inlineData: {
          data: imageData.data, // base64 인코딩된 이미지 데이터
          mimeType: imageData.mimeType || "image/jpeg"
        }
      };

      // Gemini Vision API 호출
      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const summary = response.text();

      return {
        summary: summary.trim(),
        imageType: imageData.mimeType || "image/jpeg",
        summaryLength: summary.trim().length,
        type: "image",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("Gemini image summarization error:", error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      // Gemini API 에러 처리
      if (error.message?.includes('API_KEY')) {
        throw new ExternalServiceError("Gemini API 키가 설정되지 않았습니다.");
      }
      
      if (error.message?.includes('quota')) {
        throw new ExternalServiceError("Gemini API 할당량을 초과했습니다.");
      }
      
      throw new ExternalServiceError("이미지 요약 중 오류가 발생했습니다.");
    }
  }

  /**
   * 텍스트 요약을 위한 프롬프트 생성
   */
  _generateTextPrompt(text) {
    let instruction = "다음 글을 간결하게 요약해주세요. 글머리 기호 없이 자연스러운 문장으로 작성하고, ~했다/~하다 형태로 써주세요.";
    return `${instruction}\n\n텍스트:\n${text}`;
  }

  /**
   * 이미지 요약을 위한 프롬프트 생성
   */
  _generateImagePrompt() {
    return "이 이미지를 간결하게 요약해주세요. 글머리 기호 없이 자연스러운 문장으로 작성하고, ~했다/~하다 형태로 써주세요.";
  }

  /**
   * 다중 이미지 요약 (이미지 그룹용)
   */
  async summarizeMultipleImages(imageDataArray) {
    try {
      if (!Array.isArray(imageDataArray) || imageDataArray.length === 0) {
        throw new BadRequestError("이미지 데이터 배열이 제공되지 않았습니다.");
      }

      const prompt = "이 이미지를 간결하게 요약해주세요. 글머리 기호 없이 자연스러운 문장으로 작성하고, ~했다/~하다 형태로 써주세요. 이미지 간의 연관성을 고려하여 전체적인 내용을 요약해주세요.";

      // 이미지 파트 배열 준비
      const imageParts = imageDataArray.map(imageData => ({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType || "image/jpeg"
        }
      }));

      // 프롬프트와 이미지들을 함께 전달
      const contentArray = [prompt, ...imageParts];
      
      const result = await this.visionModel.generateContent(contentArray);
      const response = await result.response;
      const summary = response.text();

      return {
        summary: summary.trim(),
        imageCount: imageDataArray.length,
        summaryLength: summary.trim().length,
        type: "multiple_images",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("Gemini multiple images summarization error:", error);
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new ExternalServiceError("다중 이미지 요약 중 오류가 발생했습니다.");
    }
  }
}

export default GeminiService;