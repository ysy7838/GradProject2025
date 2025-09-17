import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExternalServiceError, BadRequestError } from "../../../utils/customError.js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import stripMarkdown from "strip-markdown";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * 마크다운 텍스트를 평문으로 변환
   */
  _convertMarkdownToText(markdownContent) {
    try {
      const result = unified()
        .use(remarkParse)
        .use(stripMarkdown)
        .processSync(markdownContent);
      return result.toString().trim();
    } catch (error) {
      console.error("Markdown conversion error:", error);
      return markdownContent; // 변환 실패 시 원본 반환
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
  async summarizeText(content, options = {}) {
    try {
      // 마크다운을 평문으로 변환
      const plainText = this._convertMarkdownToText(content);
      
      // 텍스트 길이 검증
      this._validateTextLength(plainText);

      // 요약 프롬프트 생성
      const prompt = this._generateTextPrompt(plainText, options);

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
  async summarizeImage(imageData, options = {}) {
    try {
      // 이미지 데이터 검증
      if (!imageData || !imageData.data) {
        throw new BadRequestError("이미지 데이터가 제공되지 않았습니다.");
      }

      // 프롬프트 생성
      const prompt = this._generateImagePrompt(options);

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
  _generateTextPrompt(text, options = {}) {
    const {
      language = "ko",
      style = "brief", // brief, detailed
      focus = "general" // general, key_points, summary
    } = options;

    let instruction = "다음 텍스트를 한국어로 요약해주세요.";
    
    if (style === "detailed") {
      instruction += " 주요 내용과 핵심 포인트를 포함하여 상세히 요약해주세요.";
    } else {
      instruction += " 핵심 내용만 간단하고 명확하게 요약해주세요.";
    }

    if (focus === "key_points") {
      instruction += " 특히 중요한 키워드와 핵심 개념을 중심으로 정리해주세요.";
    }
    
    return `${instruction}\n\n텍스트:\n${text}`;
  }

  /**
   * 이미지 요약을 위한 프롬프트 생성
   */
  _generateImagePrompt(options = {}) {
    const {
      language = "ko",
      style = "descriptive", // descriptive, analytical
      focus = "content" // content, text, objects
    } = options;

    let instruction = "이 이미지를 한국어로 분석하고 요약해주세요.";
    
    if (focus === "text") {
      instruction += " 특히 이미지에 포함된 텍스트나 문자 내용을 중심으로 설명해주세요.";
    } else if (focus === "objects") {
      instruction += " 이미지에 나타난 주요 객체나 요소들을 중심으로 설명해주세요.";
    } else {
      instruction += " 이미지의 전반적인 내용, 주요 요소, 중요한 정보를 포괄적으로 설명해주세요.";
    }

    if (style === "analytical") {
      instruction += " 분석적이고 구체적으로 설명해주세요.";
    } else {
      instruction += " 명확하고 이해하기 쉽게 설명해주세요.";
    }
    
    return instruction;
  }

  /**
   * 다중 이미지 요약 (이미지 그룹용)
   */
  async summarizeMultipleImages(imageDataArray, options = {}) {
    try {
      if (!Array.isArray(imageDataArray) || imageDataArray.length === 0) {
        throw new BadRequestError("이미지 데이터 배열이 제공되지 않았습니다.");
      }

      const prompt = "다음 이미지들을 종합적으로 분석하고 한국어로 요약해주세요. 각 이미지의 내용과 전체적인 맥락을 설명해주세요.";

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