import {CustomError} from "../utils/customError.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error encountered:", err);

  // CustomError
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({message: err.message});
  }

  // Mongoose/MongoDB 에러
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({message: messages.join(", ")});
  }
  if (err.code === 11000) {
    return res.status(409).json({message: "이미 존재하는 데이터입니다."});
  }
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({message: "잘못된 형식의 ID입니다."});
  }

  // 그 외
  res.status(500).json({message: "알 수 없는 서버 오류가 발생했습니다."});
};

export default errorHandler;
