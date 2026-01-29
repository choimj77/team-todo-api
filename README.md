# Team Todo API

팀 단위로 할 일을 관리할 수 있는 **웹 기반 To-do 관리 백엔드 API**입니다.  
Node.js + Express + MySQL을 사용해 REST API 형태로 구현했습니다.

---

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MySQL
- **ORM/Driver**: mysql2
- **Dev Tool**: nodemon
- **Environment**: dotenv

---

## 📁 Project Structure

```text
Team-Todo-api/
├ src/
│ ├ app.js # Express 앱 엔트리
│ └ db.js # MySQL connection pool
├ .env.example # 환경 변수 예시
├ .gitignore
├ package.json
├ package-lock.json
└ README.md
```

---

## ⚙️ Environment Setup

### 1️⃣ Repository Clone

```bash
git clone https://github.com/choimj77/team-todo-api.git
cd team-todo-api
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

`.env.example`을 참고해 `.env` 파일을 생성합니다.

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=team_todo

```
⚠️ .env 파일은 GitHub에 포함되지 않습니다.

---

## ▶️ Run Server (Dev)

```bash
run npm dev
```

서버 실행 후:

```arduino
http://localhost:3000
```

---

## ✅ Health Check

### API Derver

```sql
GET /
```

Response:
```json
{
  "ok": true,
  "message": "Team Todo API running"
}
```

### Database Connection Test

```bash
GET /db-test
```

Response:
```json
{
  "ok": true,
  "db": 1
}
```

---

## 🎯 Purpose

- 팀 단위 협업을 고려한 할 일 관리 시스템 백엔드 구현
- Node.js 기반 REST API 설계 및 MySQL 연동 경험
- 환경 변수 분리 및 보안 설정(.env) 적용

---

## 🚀 Future Work

- Teams API (팀 생성 / 참여)
- Todos API (CRUD)
- 사용자 권한 및 인증
- 프론트엔드(To-do UI) 연동
