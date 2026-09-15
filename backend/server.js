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
// Notion接続テスト
// --------------------

app.get("/api/projects", async (req, res) => {
  try {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_PROJECTS_DATABASE_ID,
    });

    const projects = response.results
  .filter((page) => {
    return page.properties.Name?.title?.length > 0;
  })
  .map((page) => {
    const properties = page.properties;

    return {
      id: properties.ID?.rich_text?.[0]?.plain_text ?? "",

      title:
        properties.Name?.title?.[0]?.plain_text ?? "",

      shortDescription:
        properties.ShortDescription?.rich_text?.[0]?.plain_text ?? "",

      description:
        properties.Description?.rich_text?.[0]?.plain_text ?? "",

      development:
        properties.Development?.rich_text?.[0]?.plain_text ?? "",

      startDate:
        properties.StartDate?.date?.start ?? "",
      endDate:
        properties.EndDate?.date?.start ?? "",
      updatedDate:
        properties.UpdatedDate?.date?.start ?? "",

      team:
        properties.Team?.rich_text?.[0]?.plain_text ?? "",

      role:
        properties.Role?.rich_text?.[0]?.plain_text ?? "",

      technologies:
        properties.Technologies?.multi_select?.map(
          (item) => item.name
        ) ?? [],

      imageUrl:
        properties.Image?.files?.[0]?.file?.url ??
        properties.Image?.files?.[0]?.external?.url ??
        "",
      
      
    };
  });

    res.json({
      ok: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_PROJECTS_DATABASE_ID,
    });

    const page = response.results.find((page) => {
      return (
        page.properties.ID?.rich_text?.[0]?.plain_text === req.params.id
      );
    });

    if (!page) {
      return res.status(404).json({
        ok: false,
        message: "Project not found",
      });
    }

    const properties = page.properties;

    const project = {
  id: properties.ID?.rich_text?.[0]?.plain_text ?? "",

  title:
    properties.Name?.title?.[0]?.plain_text ?? "",

  shortDescription:
    properties.ShortDescription?.rich_text?.[0]?.plain_text ?? "",

  description:
    properties.Description?.rich_text?.[0]?.plain_text ?? "",

  development:
    properties.Development?.rich_text?.[0]?.plain_text ?? "",

  startDate:
    properties.StartDate?.date?.start ?? "",
  endDate:
    properties.EndDate?.date?.start ?? "",
  updatedDate:
    properties.UpdatedDate?.date?.start ?? "",

  team:
    properties.Team?.rich_text?.[0]?.plain_text ?? "",

  role:
    properties.Role?.rich_text?.[0]?.plain_text ?? "",

  technologies:
    properties.Technologies?.multi_select?.map(
      (item) => item.name
    ) ?? [],

  imageUrl:
    properties.Image?.files?.[0]?.file?.url ??
    properties.Image?.files?.[0]?.external?.url ??
    "",
};

    res.json(project);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

// 経歴情報取得
app.get("/api/career", async (req, res) => {
  try {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_CAREER_DATABASE_ID,
    });

    const career = response.results
      .filter((page) => {
        return page.properties.Name?.title?.length > 0;
      })
      .map((page) => {
        const properties = page.properties;

        return {
          title:
            properties.Name?.title?.[0]?.plain_text ?? "",

          date:
            properties.Date?.date?.start ?? "",

          category:
            properties.Category?.multi_select
              ?.map((item) => item.name)
              ?? [],

          sortOrder:
            properties.SortOrder?.number ?? 0,

          description:
            properties.Description?.rich_text?.[0]?.plain_text ?? "",
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    res.json({
      ok: true,
      count: career.length,
      career,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

// --------------------
// サーバー起動
// --------------------

app.listen(PORT, () => {
  console.log(`Backend: http://localhost:${PORT}`);
});