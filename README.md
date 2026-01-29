# Team Todo API

팀 단위로 할 일을 관리할 수 있는 **웹 기반 To-do 관리 백엔드 REST API**입니다.  
팀 생성 및 참여, 팀별 할 일 관리 기능을 제공하며  
Node.js, Express, MySQL을 사용해 구현했습니다.

---

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MySQL
- **ORM/Driver**: mysql2
- **Dev Tool**: nodemon
- **Environment**: dotenv

---

## ✨ Features

- 팀 생성 및 참여를 위한 **Join Code** 기능
- 팀 단위 할 일(To-do) 관리
- 할 일 CRUD(Create / Read / Update / Delete)
- 우선순위(priority) 및 마감일(due date) 지원
- Express + MySQL 기반 RESTful API 설계

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

### 1️⃣ Clone Repository

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
⚠️ .env 파일은 GitHub에 커밋되지 않습니다.

---

## ▶️ Run Server (Development)

```bash
run npm dev
```

서버 실행 후 접속:

```text
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

## API Endpoints

### Teams
- `POST /api/teams` : Create a team
- `GET /api/teams` : Get all teams
- `GET /api/teams/by-code/:code` : Get team by join code

### Todos
- `GET /api/todos?teamId={teamId}` : Get todos by team
- `POST /api/todos` : Create a todo
- `PATCH /api/todos/:id` : Update a todo
- `DELETE /api/todos/:id` : Delete a todo

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

---

## 📝 Notes

이 프로젝트는 실제 서비스에서 사용되는 백엔드 패턴을 연습하기 위해
팀과 할 일을 명확히 분리한 구조로 설계되었습니다.
