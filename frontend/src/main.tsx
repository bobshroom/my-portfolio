import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

type Project = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  period: string;
  team: string;
  role: string;
  technologies: string[];
};

const projects:Project[]=[
{id:"mahjong-battle",title:"Mahjong Battle",shortDescription:"UnityとCloud Firestoreを使用して制作した2D麻雀ゲーム。",description:"4人チームで制作した2D麻雀ゲームです。オンラインでプレイヤー同士が対戦できるゲームを目標として開発しました。",period:"2025年",team:"4人",role:"プログラミング・ゲームシステム実装",technologies:["Unity","C#","Cloud Firestore"]},
{id:"sample-game",title:"Sample Game",shortDescription:"ゲーム開発の学習・制作を通して作成したサンプルゲーム。",description:"ゲームプログラミングの学習過程で制作したゲームです。今後、詳細な内容を追加していく予定です。",period:"2026年",team:"個人制作",role:"企画・プログラミング",technologies:["Unity","C#"]}
];

function Layout({children}:{children:React.ReactNode}){return <><header className="site-header"><a href="/" className="logo">BOB Portfolio</a><nav><a href="/">Home</a><a href="/#projects">Projects</a><a href="/#career">Career</a></nav></header>{children}<footer>© 2026 BOB</footer></>}

function Home() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("http://localhost:3000/api/projects")
      .then((response) => response.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("制作物の取得に失敗しました:", error);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <header className="hero">
        <div className="hero-inner">
          <div className="profile-icon">BOB</div>

          <div>
            <p className="eyebrow">PORTFOLIO</p>
            <h1>BOB</h1>

            <p className="lead">
              ゲームプログラマーを目指して、
              ゲーム開発やプログラミングに取り組んでいます。
            </p>
          </div>
        </div>
      </header>

      <main>
        <section>
          <h2>自己紹介</h2>

          <p>
            Unityを中心にゲーム開発を行っています。
            プログラミングやコンピュータ技術を学びながら、
            制作物を増やしています。
          </p>
        </section>

        <section id="career">
          <h2>経歴</h2>

          <div className="timeline">
            <article>
              <strong>2024</strong>
              <div>福岡工業大学短期大学部 入学</div>
            </article>

            <article>
              <strong>2025</strong>
              <div>
                ゲーム開発・プログラミング制作などに取り組む
              </div>
            </article>

            <article>
              <strong>2026</strong>
              <div>鹿児島大学への編入学が決定</div>
            </article>
          </div>
        </section>

        <section id="projects">
          <h2>制作物</h2>

          {loading ? (
            <p>制作物を読み込んでいます...</p>
          ) : (
            <div className="projects">
              {projects.map((project) => (
                <a
                  className="project-card"
                  href={`/projects/${project.id}`}
                  key={project.id}
                >
                  <div className="project-image">
                    GAME
                  </div>

                  <h3>{project.title}</h3>

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
    fetch(`http://localhost:3000/api/projects/${id}`)
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
        console.error(error);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <main>
          <p>読み込んでいます...</p>
        </main>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <main className="not-found">
          <h1>404</h1>
          <p>指定された制作物が見つかりません。</p>
          <a href="/">トップページへ戻る</a>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="detail-page">
        <a href="/#projects" className="back-link">
          ← 制作物一覧に戻る
        </a>

        <div className="detail-hero">
          <div className="detail-image">
            GAME
          </div>

          <div>
            <p className="eyebrow">PROJECT</p>

            <h1>{project.title}</h1>

            <p className="lead">
              {project.shortDescription}
            </p>
          </div>
        </div>

        <section>
          <h2>概要</h2>

          <p className="detail-text">
            {project.description}
          </p>
        </section>

        <section>
          <h2>制作情報</h2>

          <dl className="info-list">
            <div>
              <dt>制作期間</dt>
              <dd>{project.period}</dd>
            </div>

            <div>
              <dt>チーム</dt>
              <dd>{project.team}</dd>
            </div>

            <div>
              <dt>担当</dt>
              <dd>{project.role}</dd>
            </div>

            <div>
              <dt>使用技術</dt>
              <dd>
                {project.technologies.join(" / ")}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>開発について</h2>

          <p className="detail-text">
            ここに開発中に工夫した点、苦労した点、
            担当した機能などを追加できます。
          </p>
        </section>

        <a href="/#projects" className="back-button">
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
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);