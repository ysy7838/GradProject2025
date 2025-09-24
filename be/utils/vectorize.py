# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from markdown import markdown
from bs4 import BeautifulSoup
import kss

# 임베딩 모델 로드
# TODO: 다국어 지원 모델로 변경 필요
try:
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
except Exception as e:
    print(f"❌ Failed to load embedding model: {e}")
    raise SystemExit("모델 로딩 실패로 인해 애플리케이션이 종료됩니다.")

# FastAPI 애플리케이션 인스턴스 생성
app = FastAPI()


# 요청 바디를 위한 Pydantic 모델
class MemoData(BaseModel):
    title: str | None = None
    content: str
    tags: list[str] | None = None


class QueryText(BaseModel):
    query: str


def get_plain_text(markdown_text: str):
    """마크다운을 순수 텍스트로 변환"""
    html = markdown(markdown_text)
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/vectorize")
async def vectorize_memo(memo: MemoData):
    try:
        full_text = ""
        if memo.title:
            full_text += memo.title + ". "
        if memo.tags:
            full_text += " ".join(memo.tags) + ". "

        plain_text = get_plain_text(memo.content)
        full_text += plain_text
        sentences = kss.split_sentences(full_text)

        vectors = []
        original_sentences = []  # 원본 문장도 함께 반환
        for sentence in sentences:
            if sentence.strip():  # 비어있지 않은 문장만 처리
                vector = model.encode(sentence).tolist()
                vectors.append(vector)
                original_sentences.append(sentence)
        return {
            "vectors": vectors,
            "original_sentences": original_sentences,
            "sentenceCount": len(vectors),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {str(e)}")


@app.post("/query-vector")
async def get_query_vector(query_text: QueryText):
    """
    단일 검색 문자열을 받아 단일 벡터를 반환하는 API
    """
    try:
        # 단일 검색 문자열을 직접 인코딩
        vector = model.encode(query_text.query).tolist()
        return {"vector": vector}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"벡터화 실패: {str(e)}")
