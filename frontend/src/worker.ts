import { Client } from "@notionhq/client";

interface Env {
  ASSETS: Fetcher;
  NOTION_TOKEN: string;
  NOTION_PROJECTS_DATABASE_ID: string;
  NOTION_CAREER_DATABASE_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      // 制作物一覧
      if (url.pathname === "/api/projects" && request.method === "GET") {
        const notion = new Client({
          auth: env.NOTION_TOKEN,
        });

        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_PROJECTS_DATABASE_ID,
        });

        const projects = response.results
          .filter((page: any) => page.properties.Name?.title?.length > 0)
          .map((page: any) => {
            const properties = page.properties;

            return {
              id:
                properties.ID?.rich_text?.[0]?.plain_text ?? "",
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
                  (item: any) => item.name
                ) ?? [],
              imageUrl:
                properties.Image?.files?.[0]?.file?.url ??
                properties.Image?.files?.[0]?.external?.url ??
                "",
              publicUrl:
                properties.PublicURL?.url ?? null,

              sourceUrl:
                properties.SourceURL?.url ?? null,
            };
          });

        return Response.json({
          ok: true,
          count: projects.length,
          projects,
        });
      }

      // 制作物詳細
      if (
        url.pathname.startsWith("/api/projects/") &&
        request.method === "GET"
      ) {
        const id = url.pathname.split("/")[3];

        const notion = new Client({
          auth: env.NOTION_TOKEN,
        });

        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_PROJECTS_DATABASE_ID,
        });

        const page = response.results.find(
          (page: any) =>
            page.properties.ID?.rich_text?.[0]?.plain_text === id
        );

        if (!page) {
          return Response.json(
            {
              ok: false,
              message: "Project not found",
            },
            { status: 404 }
          );
        }

        const properties = page.properties;

        const project = {
          id:
            properties.ID?.rich_text?.[0]?.plain_text ?? "",
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
              (item: any) => item.name
            ) ?? [],
          imageUrl:
            properties.Image?.files?.[0]?.file?.url ??
            properties.Image?.files?.[0]?.external?.url ??
            "",
          
          publicUrl:
            properties.PublicURL?.url ?? null,

          sourceUrl:
            properties.SourceURL?.url ?? null,
        };

        return Response.json(project);
      }

      // 経歴
      if (url.pathname === "/api/career" && request.method === "GET") {
        const notion = new Client({
          auth: env.NOTION_TOKEN,
        });

        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_CAREER_DATABASE_ID,
        });

        const career = response.results
          .filter((page: any) => page.properties.Name?.title?.length > 0)
          .map((page: any) => {
            const properties = page.properties;

            return {
              title:
                properties.Name?.title?.[0]?.plain_text ?? "",
              date:
                properties.Date?.date?.start ?? "",
              category:
                properties.Category?.multi_select?.map(
                  (item: any) => item.name
                ) ?? [],
              sortOrder:
                properties.SortOrder?.number ?? 0,
              description:
                properties.Description?.rich_text?.[0]?.plain_text ?? "",
            };
          })
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

        return Response.json({
          ok: true,
          count: career.length,
          career,
        });
      }

      return env.ASSETS.fetch(request);
    } catch (error: any) {
      console.error(error);

      return Response.json(
        {
          ok: false,
          message: error.message ?? "Internal Server Error",
        },
        { status: 500 }
      );
    }
  },
};