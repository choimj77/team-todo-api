require("dotenv").config();
const express = require("express");
const cors = require("cors");

const teamsRouter = require("./routes/teams");
const todosRouter = require("./routes/todos");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/teams", teamsRouter);
app.use("/api/todos", todosRouter);

const port = Number(process.env.PORT || 3000);
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Team Todo API running" });
});
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

const db = require("./db");

app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");
    res.json({
      ok: true,
      db: rows[0].result,
    });
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});
