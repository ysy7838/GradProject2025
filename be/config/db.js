import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

// db 연결
const connect = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB가 연결되었습니다.");
  } catch (err) {
    console.error("MongoDB가 연결되지 않았습니다.", err);
    process.exit(1);
  }
};

export default connect;
