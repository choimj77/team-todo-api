const express = require("express");
const pool = require("../db");
const { makeJoinCode } = require("../utils/code");

const router = express.Router();

// 팀 생성
router.post("/", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  // join_code 중복 가능성 낮지만 안전하게 재시도
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = makeJoinCode(8);

    try {
      const [result] = await pool.execute(
        "INSERT INTO teams (name, join_code) VALUES (?, ?)",
        [name, joinCode]
      );

      return res.status(201).json({
        id: result.insertId,
        name,
        join_code: joinCode,
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") continue;
      console.error(err);
      return res.status(500).json({ error: "server error" });
    }
  }

  return res.status(500).json({ error: "failed to generate join code" });
});

// join_code로 팀 조회(참여용)
router.get("/by-code/:code", async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "code is required" });

  const [rows] = await pool.execute(
    "SELECT id, name, join_code, created_at FROM teams WHERE join_code = ?",
    [code]
  );

  if (rows.length === 0) return res.status(404).json({ error: "team not found" });
  return res.json(rows[0]);
});

module.exports = router;
