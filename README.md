# Team Todo API

팀 단위로 할 일을 관리할 수 있는 **웹 기반 To-do 관리 백엔드 + 간단 UI** 프로젝트입니다.  
Node.js(Express) + MySQL로 REST API를 구현했고, `public/`에서 UI를 정적 서빙합니다.

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

- 팀 조회(Join Code로 팀 불러오기)
- 팀별 To-do 관리 (CRUD)
- 완료/미완료(done) 처리
- 우선순위(priority) / 마감일(due_at) 지원
- 검색 / 필터(전체·진행중·완료) / 정렬(최신순 등) UI


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

## ⚙️ Environment Variables

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

## ▶️ Run Locally

```bash
git clone https://github.com/choimj77/team-todo-api.git
cd team-todo-api
npm install
npm run dev
```

- UI: `http://localhost:3000/`
- API Health: `http://localhost:3000/health`


서버 실행 후 접속:

```text
http://localhost:3000
```

---

## API Endpoints

### Health
- `GET / : UI/서버 기본 응답`
- `GET /health : 서버 상태 확인`
- `GET /db-test : DB 연결 테스트 (구현한 경우)`

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

## 🧪 Example Requests

### Create Todo
`POST /api/todos`

```json
{
  "team_id": 10,
  "title": "첫 번째 할 일",
  "priority": "mid",
  "due_at": "2026-02-01"
}
```
### Update Todo (done 처리)
`PATCH /api/todos/:id `

```json
{
  "done": 1
}
```

---

## 🚀 Future Work

- 로그인/권한(팀 멤버) 기능
- 배포(Render/Railway) + DB 호스팅
- UI 개선(팀 선택 UX, 인라인 편집 UX 고도화)

---

## 📝 Notes

이 프로젝트는 실제 서비스에서 자주 쓰는 패턴을 연습하기 위해,
- 환경변수 분리
- REST API 구조화(routes 분리)
- MySQL 연동 및 CRUD
- 정적 UI + API 통합 서빙을 목표로 구현했습니다.