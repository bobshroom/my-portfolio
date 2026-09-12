# BOB Portfolio

React + Vite をフロントエンド、Node.js + Express をバックエンドとして作るポートフォリオサイトの最初の土台です。

## 起動

### 1. Backend

```bash
cd backend
npm install
npm start
```

http://localhost:3000/api/health

### 2. Frontend

別のターミナルで:

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173

現在はNotion APIには接続していません。
次の段階でExpressからNotion APIへ接続し、経歴・制作物をNotionから取得します。
