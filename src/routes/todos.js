const express = require("express");
const pool = require("../db");

const router = express.Router();

// 특정 팀의 todo 목록
router.get("/", async (req, res) => {
  const teamId = Number(req.query.teamId);
  if (!teamId) return res.status(400).json({ error: "teamId is required" });

  const [rows] = await pool.execute(
    `SELECT id, team_id, title, done, priority, due_at, created_at, updated_at
     FROM todos
     WHERE team_id = ?
     ORDER BY created_at DESC`,
    [teamId]
  );

  res.json(rows);
});

// todo 생성
router.post("/", async (req, res) => {
  const teamId = Number(req.body?.teamId);
  const title = String(req.body?.title || "").trim();
  const priority = req.body?.priority || "mid";
  const dueAt = req.body?.dueAt || null; // "YYYY-MM-DD" 또는 null

  if (!teamId) return res.status(400).json({ error: "teamId is required" });
  if (!title) return res.status(400).json({ error: "title is required" });

  const [result] = await pool.execute(
    `INSERT INTO todos (team_id, title, priority, due_at)
     VALUES (?, ?, ?, ?)`,
    [teamId, title, priority, dueAt]
  );

  res.status(201).json({ id: result.insertId });
});

// todo 수정(제목/우선순위/마감일/완료)
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  const fields = [];
  const values = [];

  if (req.body.title !== undefined) {
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "title cannot be empty" });
    fields.push("title = ?");
    values.push(title);
  }

  if (req.body.done !== undefined) {
    fields.push("done = ?");
    values.push(Boolean(req.body.done));
  }

  if (req.body.priority !== undefined) {
    fields.push("priority = ?");
    values.push(req.body.priority);
  }

  if (req.body.dueAt !== undefined) {
    fields.push("due_at = ?");
    values.push(req.body.dueAt || null);
  }

  if (fields.length === 0) return res.status(400).json({ error: "no fields to update" });

  values.push(id);

  const [result] = await pool.execute(
    `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "todo not found" });
  res.json({ ok: true });
});

// todo 삭제
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  const [result] = await pool.execute("DELETE FROM todos WHERE id = ?", [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "todo not found" });

  res.json({ ok: true });
});

module.exports = router;
