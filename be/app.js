import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {mongoConnect} from "./config/db.js";
import {elasticConnect, getElasticClient} from "./config/elastic.js";
import {S3Client} from "@aws-sdk/client-s3";
import errorHandler from "./middlewares/errorHandler.js";

import User from "./models/User.js";
import Tag from "./models/Tag.js";
import Memo from "./models/Memo.js";
import Category from "./models/Category.js";

import UserRepository from "./modules/users/repository/user.repository.js";
import TagRepository from "./modules/memos/repository/tag.repository.js";
import MemoRepository from "./modules/memos/repository/memo.repository.js";
import CategoryRepository from "./modules/categories/repository/category.repository.js";

import UserService from "./modules/users/service/user.service.js";
import FileService from "./modules/memos/service/file.service.js";
import TagService from "./modules/memos/service/tag.service.js";
import MemoService from "./modules/memos/service/memo.service.js";
import CategoryService from "./modules/categories/service/category.service.js";
import GeminiService from "./modules/memos/service/gemini.service.js";

import UserController from "./modules/users/controller/user.controller.js";
import MemoController from "./modules/memos/controller/memo.controller.js";
import FileController from "./modules/memos/controller/file.controller.js";
import CategoryController from "./modules/categories/controller/category.controller.js";

import UserRoutes from "./modules/users/routes/user.routes.js";
import MemoRoutes from "./modules/memos/routes/memo.routes.js";
import FileRoutes from "./modules/memos/routes/file.routes.js";
import CategoryRoutes from "./modules/categories/routes/category.routes.js";
import {getCategoryAndCheckPermission} from "./utils/permissionCheck.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json());
app.use(express.urlencoded());
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await mongoConnect();
  await elasticConnect();
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const elasticClient = getElasticClient();

  // app.js에서 initialization 하도록 수정
  const userRepository = new UserRepository(User, Category, Memo);
  const tagRepository = new TagRepository(Tag);
  const memoRepository = new MemoRepository(Memo);
  const categoryRepository = new CategoryRepository(Category);

  // utils
  const permissionCheckHelper = getCategoryAndCheckPermission(categoryRepository);

  // service, controller 생성
  const userService = new UserService(userRepository);
  const tagService = new TagService(tagRepository);
  const fileService = new FileService(s3Client);
  const geminiService = new GeminiService();
  const memoService = new MemoService(memoRepository, tagService, elasticClient, permissionCheckHelper, geminiService);
  const categoryService = new CategoryService(categoryRepository, memoService, permissionCheckHelper);

  const userController = new UserController(userService);
  const memoController = new MemoController(memoService);
  const fileController = new FileController(fileService);
  const categoryController = new CategoryController(categoryService);

  // 라우트 설정
  app.use("/api/categories", CategoryRoutes(categoryController));
  app.use("/api/users", UserRoutes(userController));
  app.use("/api/memos", MemoRoutes(memoController));
  app.use("/api/files", FileRoutes(fileController));
  app.get("/", (req, res) => {
    res.status(200).send("OK");
  });

  app.use(errorHandler);
  app.listen(PORT, () => console.log(`Server started on port ${PORT} (env: ${process.env.NODE_ENV})`));
};

startServer();
