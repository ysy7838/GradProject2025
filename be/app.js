import express from "express";
import cors from "cors";
import dotenv from "dotenv"

import connect from "./config/db.js";
import categoryRoutes from "./modules/categories/routes/category.routes.js";
import userRoutes from "./modules/users/routes/user.routes.js";
import memoRoutes from "./modules/memos/routes/memo.routes.js";
import fileRoutes from "./modules/memos/routes/file.routes.js";
import errorHandler from "./middlewares/errorHandler.js"

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json());
app.use(express.urlencoded());

// DB 연결
connect();

// 라우트 설정
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memos", memoRoutes);
app.use("/api/files", fileRoutes);
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server started on port ${PORT} (env: ${process.env.NODE_ENV})`)
);
