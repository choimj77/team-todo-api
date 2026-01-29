const express = require("express");
const pool = require("../db");

const router = express.Router();

/**
 * 공통 유틸: priority 검증
 * 테이블이 enum('low','mid','high')라고 가정
 */
function normalizePriority(value) {
  if (value === null || value === undefined || value === "") return null;
  const v = String(value).trim().toLowerCase();
  if (!["low", "mid", "high"].includes(v)) return "__INVALID__";
  return v;
}

/**
 * 공통 유틸: done(0/1, true/false) 정규화
 */
function normalizeDone(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value === true || value === "true" || value === 1 || value === "1") return 1;
  if (value === false || value === "false" || value === 0 || value === "0") return 0;
  return "__INVALID__";
}

/**
 * GET /api/todos?teamId=10
 * 특정 팀의 할 일 목록 조회
 */
router.get("/", async (req, res) => {
  const teamId = Number(req.query.teamId);
  if (!teamId) return res.status(400).json({ error: "teamId is required (number)" });

  try {
    const [rows] = await pool.execute(
      `SELECT id, team_id, title, done, priority, due_at, created_at, updated_at
       FROM todos
       WHERE team_id = ?
       ORDER BY
         (due_at IS NULL) ASC,
         due_at ASC,
         created_at DESC`,
      [teamId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /api/todos
 * body: { team_id, title, priority?, due_at? }
 */
router.post("/", async (req, res) => {
  const teamId = Number(req.body?.team_id);
  const title = String(req.body?.title || "").trim();

  if (!teamId) return res.status(400).json({ error: "team_id is required (number)" });
  if (!title) return res.status(400).json({ error: "title is required" });

  const priority = normalizePriority(req.body?.priority);
  if (priority === "__INVALID__") {
    return res.status(400).json({ error: "priority must be one of: low, mid, high" });
  }

  // due_at: 'YYYY-MM-DD' 또는 null
  const dueAtRaw = req.body?.due_at;
  const dueAt = dueAtRaw ? String(dueAtRaw).trim() : null;

  try {
    // team 존재 확인(외래키 없거나 느슨하게 만들었을 때도 안전)
    const [teamRows] = await pool.execute("SELECT id FROM teams WHERE id = ?", [teamId]);
    if (teamRows.length === 0) return res.status(404).json({ error: "team not found" });

    const [result] = await pool.execute(
      "INSERT INTO todos (team_id, title, done, priority, due_at) VALUES (?, ?, 0, ?, ?)",
      [teamId, title, priority, dueAt]
    );

    const [rows] = await pool.execute(
      `SELECT id, team_id, title, done, priority, due_at, created_at, updated_at
       FROM todos WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    // due_at 포맷이 이상하면 MySQL이 에러를 내는 경우가 많음
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * PATCH /api/todos/:id
 * body에 들어온 필드만 부분 수정
 * body: { title?, done?, priority?, due_at? }
 */
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  const titleRaw = req.body?.title;
  const doneRaw = req.body?.done;
  const priorityRaw = req.body?.priority;
  const dueAtRaw = req.body?.due_at;

  const updates = [];
  const values = [];

  if (titleRaw !== undefined) {
    const t = String(titleRaw || "").trim();
    if (!t) return res.status(400).json({ error: "title cannot be empty" });
    updates.push("title = ?");
    values.push(t);
  }

  if (doneRaw !== undefined) {
    const d = normalizeDone(doneRaw);
    if (d === "__INVALID__") return res.status(400).json({ error: "done must be boolean or 0/1" });
    updates.push("done = ?");
    values.push(d);
  }

  if (priorityRaw !== undefined) {
    const p = normalizePriority(priorityRaw);
    if (p === "__INVALID__") {
      return res.status(400).json({ error: "priority must be one of: low, mid, high" });
    }
    updates.push("priority = ?");
    values.push(p);
  }

  if (dueAtRaw !== undefined) {
    // null로 보내면 마감일 제거
    const dueAt = (dueAtRaw === null || dueAtRaw === "") ? null : String(dueAtRaw).trim();
    updates.push("due_at = ?");
    values.push(dueAt);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "no fields to update" });
  }

  try {
    // 존재 확인
    const [exists] = await pool.execute("SELECT id FROM todos WHERE id = ?", [id]);
    if (exists.length === 0) return res.status(404).json({ error: "todo not found" });

    values.push(id);
    await pool.execute(`UPDATE todos SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.execute(
      `SELECT id, team_id, title, done, priority, due_at, created_at, updated_at
       FROM todos WHERE id = ?`,
      [id]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * DELETE /api/todos/:id
 */
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  try {
    const [result] = await pool.execute("DELETE FROM todos WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "todo not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
