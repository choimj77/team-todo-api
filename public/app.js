// public/app.js
// Team Todo UI (public/index.html) 전용
// API base: same origin (Express에서 public 정적서빙 + /api 라우팅)

(() => {
  // =========================
  // DOM
  // =========================
  const $ = (sel) => document.querySelector(sel);

  const teamCodeInput = $("#teamCodeInput");
  const teamLoadBtn = $("#teamLoadBtn");
  const teamStatus = $("#teamStatus");

  const todoForm = $("#todo-form");
  const todoTitleInput = $("#todoTitleInput");
  const todoDueInput = $("#todoDueInput");
  const todoPrioritySelect = $("#todoPrioritySelect");
  const todoAddBtn = $("#todoAddBtn");

  const filterBtns = document.querySelectorAll(".filter-btn");
  const searchInput = $("#search-input");
  const sortSelect = $("#sort-select");

  const statTotal = $("#stat-total");
  const statActive = $("#stat-active");
  const statDone = $("#stat-done");

  const todoList = $("#todoList");

  // ===============================
  // 인라인 편집 input 변화 감지
  // ===============================
  todoList.addEventListener("input", (e) => {
    const li = e.target.closest(".todo-item");
    if (!li) return;

    const id = Number(li.dataset.id);
    if (editingTodoId !== id) return;

    const titleEl = li.querySelector(".edit-title");
    const dueEl = li.querySelector(".edit-due");
    const priEl = li.querySelector(".edit-priority");

    editingDraft = {
      title: titleEl?.value ?? "",
      due_at: dueEl?.value ? dueEl.value : null,
      priority: priEl?.value ?? "mid",
    };
  });

  // =========================
  // State
  // =========================
  let selectedTeam = null; // { id, name, join_code, created_at }
  let todos = []; // raw list from API

  // UI state
  let currentFilter = "all"; // all | active | done
  let currentSearch = "";
  let currentSort = "created-desc";

  // edit state
  let editingTodoId = null;
  let editingDraft = null; // { title, due_at, priority }

  // =========================
  // Helpers
  // =========================
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeJoinCode(code) {
    return String(code ?? "").trim().toUpperCase();
  }

  function toYmd(value) {
    // 서버가 "2026-01-31T..." 또는 "2026-01-31" 둘 다 가능
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function dateToComparable(d) {
    // "YYYY-MM-DD" => number comparable
    if (!d) return null;
    const s = String(d).slice(0, 10);
    const [y, m, day] = s.split("-").map((x) => Number(x));
    if (!y || !m || !day) return null;
    return y * 10000 + m * 100 + day;
  }

  function isOverdue(dueAt) {
    const due = toYmd(dueAt);
    const dueNum = dateToComparable(due);
    if (!dueNum) return false;

    const now = new Date();
    const todayNum = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    return dueNum < todayNum;
  }

  function priorityLabel(p) {
    if (p === "high") return "중요";
    if (p === "low") return "여유";
    return "보통";
  }

  function priorityBadgeClass(p) {
    if (p === "high") return "badge-priority-high";
    if (p === "low") return "badge-priority-low";
    return "badge-priority-mid";
  }

  function getActiveTeamId() {
    return selectedTeam?.id ?? null;
  }

  function setTeamStatus(text) {
    if (teamStatus) teamStatus.textContent = text;
  }

  function resetAddForm() {
    todoForm.reset();
    todoPrioritySelect.value = "mid";
    todoAddBtn.textContent = "추가";
  }


  // =========================
  // API
  // =========================
  async function apiFetch(path, options = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    // JSON이 아닐 수도 있으니 보호
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg =
        (data && data.error) ||
        (typeof data === "string" ? data : null) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async function fetchTeamByCode(joinCode) {
    return apiFetch(`/api/teams/by-code/${encodeURIComponent(joinCode)}`);
  }

  async function fetchTodosByTeam(teamId) {
    return apiFetch(`/api/todos?teamId=${encodeURIComponent(teamId)}`);
  }

  async function createTodo(payload) {
    return apiFetch(`/api/todos`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async function updateTodo(id, payload) {
    return apiFetch(`/api/todos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async function deleteTodo(id) {
    return apiFetch(`/api/todos/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // =========================
  // Derived / Render
  // =========================
  function applyFilterSearchSort(list) {
    let out = [...list];

    // filter
    if (currentFilter === "active") {
      out = out.filter((t) => Number(t.done) !== 1);
    } else if (currentFilter === "done") {
      out = out.filter((t) => Number(t.done) === 1);
    }

    // search
    const q = currentSearch.trim().toLowerCase();
    if (q) {
      out = out.filter((t) => String(t.title ?? "").toLowerCase().includes(q));
    }

    // sort
    const byCreated = (a, b) => {
      const ac = new Date(a.created_at ?? 0).getTime();
      const bc = new Date(b.created_at ?? 0).getTime();
      return ac - bc;
    };

    const byDue = (a, b) => {
      const ad = dateToComparable(toYmd(a.due_at));
      const bd = dateToComparable(toYmd(b.due_at));

      // due가 없는 건 맨 뒤로 보내기(asc), 맨 앞으로 보내기(desc) 대신
      if (ad == null && bd == null) return 0;
      if (ad == null) return 1;
      if (bd == null) return -1;
      return ad - bd;
    };

    if (currentSort === "created-asc") out.sort(byCreated);
    else if (currentSort === "created-desc") out.sort((a, b) => byCreated(b, a));
    else if (currentSort === "due-asc") out.sort(byDue);
    else if (currentSort === "due-desc") out.sort((a, b) => byDue(b, a));

    return out;
  }

  function updateStats(list) {
    const total = list.length;
    const done = list.filter((t) => Number(t.done) === 1).length;
    const active = total - done;

    statTotal.textContent = `전체: ${total}`;
    statActive.textContent = `진행중: ${active}`;
    statDone.textContent = `완료: ${done}`;
  }

  function todoItemHTML(todo) {
    const id = Number(todo.id);
    const done = Number(todo.done) === 1;

    const isEditing = editingTodoId === id;

    const due = toYmd(todo.due_at);
    const pri = todo.priority || "mid";

    const titleText = escapeHtml(todo.title ?? "");

    const viewMain = `
      <div class="todo-main">
        <div class="todo-title">${titleText}</div>
        <div class="todo-meta">
          <span class="badge ${priorityBadgeClass(pri)}">${priorityLabel(pri)}</span>
          ${due ? `<span class="badge">마감: ${escapeHtml(due)}</span>` : `<span class="badge">마감 없음</span>`}
          ${due && isOverdue(due) && !done ? `<span class="badge badge-overdue">지남</span>` : ""}
        </div>
      </div>
    `;

    const editTitle = escapeHtml(editingDraft?.title ?? (todo.title ?? ""));
    const editDue = toYmd(editingDraft?.due_at ?? todo.due_at) || "";
    const editPri = editingDraft?.priority ?? pri;

    const editMain = `
      <div class="todo-main">
        <div class="edit-row">
          <input class="edit-title" type="text" value="${editTitle}" />
          <input class="edit-due" type="date" value="${escapeHtml(editDue)}" />
          <select class="edit-priority">
            <option value="high" ${editPri === "high" ? "selected" : ""}>중요</option>
            <option value="mid"  ${editPri === "mid" ? "selected" : ""}>보통</option>
            <option value="low"  ${editPri === "low" ? "selected" : ""}>여유</option>
          </select>
        </div>
        <div class="todo-meta">
          <span class="badge">수정 중…</span>
        </div>
      </div>
    `;

    const actionsView = `
      <div class="todo-actions">
        <button class="btn ${done ? "btn-ghost" : "btn-success"}" data-action="complete">${done ? "되돌리기" : "완료"}</button>
        <button class="btn btn-primary" data-action="edit">수정</button>
        <button class="btn btn-danger" data-action="delete">삭제</button>
      </div>
    `;

    const actionsEdit = `
      <div class="todo-actions">
        <button class="btn btn-success" data-action="save">저장</button>
        <button class="btn btn-ghost" data-action="cancel">취소</button>
      </div>
    `;

    return `
      <li class="todo-item ${done ? "is-done" : ""}" data-id="${id}">
        <div class="todo-left">
          <input class="todo-checkbox" type="checkbox" ${done ? "checked" : ""} />
        </div>
        ${isEditing ? editMain : viewMain}
        ${isEditing ? actionsEdit : actionsView}
      </li>
    `;
  }

  function render() {
    const teamId = getActiveTeamId();

    // 팀 미선택 상태면 안내
    if (!teamId) {
      todoList.innerHTML = `
        <li style="list-style:none; padding:16px; color:#64748b;">
          팀을 먼저 불러오면 할 일을 볼 수 있어요.
        </li>
      `;
      updateStats([]);
      return;
    }

    const visible = applyFilterSearchSort(todos);
    updateStats(todos);

    if (visible.length === 0) {
      todoList.innerHTML = `
        <li style="list-style:none; padding:16px; color:#64748b;">
          표시할 할 일이 없어요.
        </li>
      `;
      return;
    } 

    todoList.innerHTML = visible.map(todoItemHTML).join("");
  }

  // =========================
  // Loaders
  // =========================
  async function loadTodos() {
    const teamId = getActiveTeamId();
    if (!teamId) return;

    const list = await fetchTodosByTeam(teamId);
    // 서버가 배열을 주는 걸 기대
    todos = Array.isArray(list) ? list : [];
    render();
  }

  // =========================
  // Events
  // =========================
  teamLoadBtn.addEventListener("click", async () => {
    try {
      const code = normalizeJoinCode(teamCodeInput.value);
      if (!code) {
        alert("JOIN CODE를 입력해줘.");
        return;
      }

      const team = await fetchTeamByCode(code);
      selectedTeam = team;

      setTeamStatus(`팀: ${team.name} (${team.join_code})`);
      resetAddForm();

      await loadTodos();
    } catch (err) {
      console.error(err);
      alert(`팀 불러오기 실패: ${err.message}`);
    }
  });

  // Enter로도 팀 불러오기
  teamCodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      teamLoadBtn.click();
    }
  });

  // add / edit submit
  todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const teamId = getActiveTeamId();
      if (!teamId) return alert("먼저 팀을 불러와줘.");

      const title = String(todoTitleInput.value ?? "").trim();
      const due_at = todoDueInput.value ? todoDueInput.value : null;
      const priority = todoPrioritySelect.value || "mid";
      if (!title) return alert("할 일을 입력해줘.");

      await createTodo({ team_id: teamId, title, due_at, priority });
      resetAddForm();
      await loadTodos();
    } catch (err) {
      console.error(err);
      alert(`추가 실패: ${err.message}`);
    }
  });


  // filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // search
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value ?? "";
    render();
  });

  // sort
  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    render();
  });

  // list actions (event delegation)
  todoList.addEventListener("click", async (e) => {
  // ✅ action 버튼을 정확히 찾기 (버튼 안쪽 클릭도 OK)
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    const li = btn.closest(".todo-item");
    if (!li) return;

    const id = Number(li.dataset.id);

    try {
    // ===============================
    // 1-4: 인라인 편집 action 처리
    // ===============================

      if (action === "edit") {
        resetAddForm();
        const t = todos.find((x) => Number(x.id) === id);
        if (!t) return;

        editingTodoId = id;
        editingDraft = {
          title: t.title ?? "",
          due_at: toYmd(due_at) || null,
          priority: t.priority ?? "mid",
        };

        render(); // ✅ li가 input/select로 바뀌게
        return;
      }

      if (action === "cancel") {
        editingTodoId = null;
        editingDraft = null;
        render();
        return;
      }

      if (action === "save") {
        if (!editingDraft) return;

        const payload = {
          title: (editingDraft.title ?? "").trim(),
          due_at: editingDraft.due_at || null,
          priority: editingDraft.priority || "mid",
        };

        if (!payload.title) {
          alert("제목은 비울 수 없어요.");
          return;
        }

        await updateTodo(id, payload);
        editingTodoId = null;
        editingDraft = null;

        await loadTodos();
        return;
      }

    // ===============================
    // ✅ 편집 중이면 edit/save/cancel 외 동작 막기
    // ===============================
      if (editingTodoId !== null) {
        alert("수정 중에는 저장/취소 먼저 해줘!");
        e.target.checked = !e.target.checked; // 원상복구
        return;
      }

    // ===============================
    // 기존 action 처리 (delete / complete)
    // ===============================

      if (action === "delete") {
        const ok = confirm("정말 삭제할까?");
        if (!ok) return;

        await deleteTodo(id);
        await loadTodos();
        return;
      }

      if (action === "complete") {
        const t = todos.find((x) => Number(x.id) === id);
        if (!t) return;

        const nextDone = Number(t.done) === 1 ? 0 : 1;
        await updateTodo(id, { done: nextDone });
        await loadTodos();
        return;
      }
    } catch (err) {
      console.error(err);
      alert(`처리 실패: ${err.message}`);
    }
  });


  todoList.addEventListener("change", async (e) => {
    if (!e.target.matches(".todo-checkbox")) return;

    const li = e.target.closest(".todo-item");
    if (!li) return;

    const id = Number(li.dataset.id);
    const done = e.target.checked ? 1 : 0;

    try {
      await updateTodo(id, { done });
      await loadTodos();
    } catch (err) {
      console.error(err);
      alert(`완료 처리 실패: ${err.message}`);
    }
  });

  // =========================
  // Init
  // =========================
  function init() {
    setTeamStatus("팀: (미선택)");
    updateStats([]);
    render();
  }

  init();
})();
