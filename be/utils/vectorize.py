# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from markdown import markdown
from bs4 import BeautifulSoup
from konlpy.tag import Okt
import kss

# Okt 형태소 분석기 인스턴스 생성
okt = Okt()
stopwords = [
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "에게",
    "와",
    "과",
    "하다",
    "이다",
    "되다",
    "아니다",
    "것",
    "수",
    "있",
    "없",
    "같",
    "그",
    "이것",
    "저것",
    "저",
    "것",
]

# 불용어로 처리할 품사 정의
stopwords_pos = ["Josa", "Eomi", "Punctuation", "Suffix", "Modifier"]

# 임베딩 모델 로드
model = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS")

# FastAPI 애플리케이션 인스턴스 생성
app = FastAPI()


# 요청 바디를 위한 Pydantic 모델
class MemoContent(BaseModel):
    content: str


def get_plain_text(markdown_text: str):
    """마크다운을 순수 텍스트로 변환"""
    html = markdown(markdown_text)
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()


def clean_sentence(sentence: str):
    """
    문장을 형태소 분석 및 불용어 제거
    """
    # 형태소 분석 및 품사 태깅
    pos_tagged_tokens = okt.pos(sentence, stem=True)

    # 불용어와 불용어 품사를 고려하여 토큰 필터링
    filtered_tokens = []
    for token, pos in pos_tagged_tokens:
        if pos not in stopwords_pos and token not in stopwords:
            filtered_tokens.append(token)

    return " ".join(filtered_tokens)


@app.post("/vectorize")
async def vectorize_memo(memo: MemoContent):
    """
    메모 내용을 받아 벡터로 변환하는 API 엔드포인트
    """
    try:
        plain_text = get_plain_text(memo.content)
        raw_sentences = [s.strip() for s in plain_text.split("\n") if s.strip()]
        sentences = []
        for line in raw_sentences:
            sentences.extend(kss.split_sentences(line))

        vectors = []
        for sentence in sentences:
            cleaned_sentence = clean_sentence(sentence)
            if cleaned_sentence:
                vector = model.encode(cleaned_sentence).tolist()
                vectors.append(vector)

        return {"vectors": vectors, "sentenceCount": len(vectors)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {str(e)}")
