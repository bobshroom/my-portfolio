const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { Client } = require("@notionhq/client");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});


// --------------------
// テスト
// --------------------

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend is running!",
  });
});


// --------------------
// Notion接続テスト
// --------------------

app.get("/api/test-notion", async (req, res) => {
  try {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_PROJECTS_DATABASE_ID,
    });

    console.log(response.results);

    res.json({
      ok: true,
      count: response.results.length,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "Notion APIへのアクセスに失敗しました",
    });
  }
});


// --------------------
// サーバー起動
// --------------------

app.listen(PORT, () => {
  console.log(`Backend: http://localhost:${PORT}`);
});