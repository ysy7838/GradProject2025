import sys
import json
from sentence_transformers import SentenceTransformer
from markdown import markdown
from bs4 import BeautifulSoup
from konlpy.tag import Okt
import kss  # 한국어 문장 토크나이저

# 형태소 분석기 및 불용어 목록
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
]

# 임베딩 모델 로드
model = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS")


def get_plain_text(markdown_text):
    """마크다운을 순수 텍스트로 변환"""
    html = markdown(markdown_text)
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()


def clean_sentence(sentence):
    """단일 문장을 형태소 분석 및 불용어 제거"""
    tokens = okt.morphs(sentence, stem=True)
    filtered_tokens = [word for word in tokens if word not in stopwords]
    return " ".join(filtered_tokens)


if __name__ == "__main__":
    if not sys.stdin.isatty():
        try:
            raw_data = sys.stdin.buffer.read()
            markdown_to_vectorize = raw_data.decode("utf-8")

            # 1. 마크다운을 순수 텍스트로 변환
            plain_text = get_plain_text(markdown_to_vectorize)

            # 2. 줄바꿈 단위로 먼저 분리
            plain_text = get_plain_text(markdown_to_vectorize).replace("\\n", "\n")
            raw_sentences = [s.strip() for s in plain_text.split("\n") if s.strip()]

            # 3. 각 줄을 kss로 문장 단위 분리
            sentences = []
            for line in raw_sentences:
                sentences.extend(kss.split_sentences(line))

            # 4. 각 문장을 정제하고 벡터로 변환
            vectors = []
            for sentence in raw_sentences:
                cleaned_sentence = clean_sentence(sentence)
                if cleaned_sentence:  # 빈 문장 제외
                    vector = model.encode(cleaned_sentence).tolist()
                    vectors.append(vector)

            # 5. JSON 형태로 벡터 배열 출력
            print(json.dumps({"vectors": vectors, "sentenceCount": len(vectors)}))

        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
    else:
        print(json.dumps({"error": "No text provided via stdin"}), file=sys.stderr)
