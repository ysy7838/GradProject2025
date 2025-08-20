// config/elastic.js
import {Client} from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const elasticURI = process.env.ELASTIC_URI || "http://localhost:9200";
const elasticAuth =
  process.env.ELASTIC_AUTH_USER && process.env.ELASTIC_AUTH_PASSWORD
    ? {
        username: process.env.ELASTIC_AUTH_USER,
        password: process.env.ELASTIC_AUTH_PASSWORD,
      }
    : null;

let elasticClient;

export const elasticConnect = async () => {
  try {
    elasticClient = new Client({
      node: elasticURI,
      auth: elasticAuth,
    });
    console.log("Elasticsearch가 연결되었습니다.");
    return elasticClient;
  } catch (err) {
    console.error("Elasticsearch가 연결되지 않았습니다.", err);
    process.exit(1);
  }
};

export const getElasticClient = () => {
  if (!elasticClient) {
    throw new Error("Elasticsearch client has not been initialized. Please call elasticConnect() first.");
  }
  return elasticClient;
};
