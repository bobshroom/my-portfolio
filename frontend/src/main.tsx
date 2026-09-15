import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

type Project = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  development: string;
  period: string;
  team: string;
  role: string;
  technologies: string[];
  imageUrl: string;
};

type Career = {
  title: string;
  date: string;
  category: string[];
  sortOrder: number;
  description: string;
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <a href="/" className="logo">
          BOB Portfolio
        </a>

        <nav>
          <a href="/">Home</a>
          <a href="/#projects">Projects</a>
          <a href="/#career">Career</a>
        </nav>
      </header>

      {children}

      <footer>© 2026 BOB</footer>
    </>
  );
}

function Home() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [career, setCareer] = React.useState<Career[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [careerLoading, setCareerLoading] = React.useState(true);

  const [error, setError] = React.useState(false);
  const [careerError, setCareerError] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/projects")
      .then((response) => {
        if (!response.ok) {
          throw new Error("制作物の取得に失敗しました");
        }

        return response.json();
      })
      .then((data) => {
        setProjects(data.projects);
        setLoading(false);
      })
      .catch((error) => {
        console.error("制作物の取得に失敗しました:", error);
        setError(true);
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
  fetch("/api/career")
    .then((response) => {
      if (!response.ok) {
        throw new Error("経歴の取得に失敗しました");
      }

      return response.json();
    })
    .then((data) => {
      setCareer(data.career);
      setCareerLoading(false);
    })
    .catch((error) => {
      console.error("経歴の取得に失敗しました:", error);
      setCareerError(true);
      setCareerLoading(false);
    });
}, []);

  return (
    <Layout>
      <header className="hero">
        <div className="hero-inner">
          <div className="profile-icon">
            BOB
          </div>

          <div>
            <p className="eyebrow">
              PORTFOLIO
            </p>

            <h1>
              BOB
            </h1>

            <p className="lead">
              ゲームプログラマーを目指して、
              ゲーム開発やプログラミングに取り組んでいます。
            </p>
          </div>
        </div>
      </header>

      <main>
        <section>
          <h2>
            自己紹介
          </h2>

          <p>
            Unityを中心にゲーム開発を行っています。
            プログラミングやコンピュータ技術を学びながら、
            制作物を増やしています。
          </p>
        </section>

        <section id="career">
  <h2>
    経歴
  </h2>

  {careerLoading && (
    <p>
      経歴を読み込んでいます...
    </p>
  )}

  {careerError && (
    <p>
      経歴の読み込みに失敗しました。
    </p>
  )}

  {!careerLoading && !careerError && career.length === 0 && (
    <p>
      経歴がありません。
    </p>
  )}

  {!careerLoading && !careerError && career.length > 0 && (
    <div className="timeline">
      {career.map((item) => (
        <article key={item.sortOrder}>
          <strong>
            {item.date.slice(0, 4)}
          </strong>

          <div>
            <h3>
              {item.title}
            </h3>

            {item.category.length > 0 && (
              <small>
                {item.category.join(" / ")}
              </small>
            )}

            <p>
              {item.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  )}
</section>

        <section id="projects">
          <h2>
            制作物
          </h2>

          {loading && (
            <p>
              制作物を読み込んでいます...
            </p>
          )}

          {error && (
            <p>
              制作物の読み込みに失敗しました。
            </p>
          )}

          {!loading && !error && projects.length === 0 && (
            <p>
              制作物がありません。
            </p>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="projects">
              {projects.map((project) => (
                <a
                className="project-card"
                href={"/projects/" + project.id}
                key={project.id}
                >
                  <div className="project-image">
  {project.imageUrl ? (
    <img
      src={project.imageUrl}
      alt={project.title}
    />
  ) : (
    <span>NO IMAGE</span>
  )}
</div>

                  <h3>
                    {project.title}
                  </h3>

                  <p>
                    {project.shortDescription}
                  </p>

                  <span className="detail-link">
                    詳細を見る →
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}

function ProjectDetail() {
  const path = window.location.pathname;
  const id = path.split("/")[2];

  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch("/api/projects/" + id)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Project not found");
        }

        return response.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("制作物の取得に失敗しました:", error);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <main>
          <p>
            読み込んでいます...
          </p>
        </main>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <main className="not-found">
          <h1>
            404
          </h1>

          <p>
            指定された制作物が見つかりません。
          </p>

          <a href="/">
            トップページへ戻る
          </a>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="detail-page">
        <a
          href="/#projects"
          className="back-link"
        >
          ← 制作物一覧に戻る
        </a>

        <div className="detail-hero">
          <div className="detail-image">
  {project.imageUrl ? (
    <img
      src={project.imageUrl}
      alt={project.title}
    />
  ) : (
    <span>NO IMAGE</span>
  )}
</div>

          <div>
            <p className="eyebrow">
              PROJECT
            </p>

            <h1>
              {project.title}
            </h1>

            <p className="lead">
              {project.shortDescription}
            </p>
          </div>
        </div>

        <section>
          <h2>
            概要
          </h2>

          <p className="detail-text">
            {project.description}
          </p>
        </section>

        <section>
          <h2>
            制作情報
          </h2>

          <dl className="info-list">
            <div>
              <dt>
                制作期間
              </dt>

              <dd>
                {project.period}
              </dd>
            </div>

            <div>
              <dt>
                チーム
              </dt>

              <dd>
                {project.team}
              </dd>
            </div>

            <div>
              <dt>
                担当
              </dt>

              <dd>
                {project.role}
              </dd>
            </div>

            <div>
              <dt>
                使用技術
              </dt>

              <dd>
                {project.technologies.join(" / ")}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>
            開発について
          </h2>

          <p className="detail-text">
            {project.development}
          </p>
        </section>

        <a
          href="/#projects"
          className="back-button"
        >
          制作物一覧に戻る
        </a>
      </main>
    </Layout>
  );
}

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/projects/")) {
    return <ProjectDetail />;
  }

  return <Home />;
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);