import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import "./Todos.css";
import { Pencil, Trash2 } from "lucide-react";

const Todos = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newTags, setNewTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const tagClassMap = {
    bug: "tag-bug",
    refactor: "tag-refactor",
    "in progress": "tag-inprogress",
    done: "tag-done",
    review: "tag-review",
    caution: "tag-caution",
  };

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/todos`);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos", err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const tags = newTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo, tags, deadline: newDeadline }),
      });
      const added = await res.json();
      setTodos([added, ...todos]);
      setNewTodo("");
      setNewTags("");
    } catch (err) {
      console.error("Failed to add todo", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_BASE}/todos/${id}`, { method: "DELETE" });
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error("Failed to delete todo", err);
    }
  };

  const toggleDone = async (id, done) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      const updated = await res.json();
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    } catch (err) {
      console.error("Failed to update todo", err);
    }
  };

  const startEditing = (id, currentText) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleTextSave = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      const updated = await res.json();
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
      cancelEdit();
    } catch (err) {
      console.error("Failed to update text", err);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [API_BASE]);

  return (
    <div
      style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          color: "#111",
        }}
      >
        <span style={{ color: "#555" }}>DevBoard</span> <strong>Todos</strong>
      </h2>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <input
          type="text"
          placeholder="Enter a new todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          style={{ flexGrow: 1, padding: "0.5rem" }}
        />
        <input
          type="datetime-local"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
          style={{ padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="tags (comma separated)"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          style={{ width: "200px", padding: "0.5rem" }}
        />
        <button onClick={addTodo} style={{ padding: "0.5rem 1rem" }}>
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[...todos]
            .sort((a, b) => {
              if (a.done !== b.done) return a.done - b.done;
              return new Date(b.created_at) - new Date(a.created_at);
            })
            .map((todo) => {
              const created = new Date(todo.created_at);
              const updated = todo.updated_at
                ? new Date(todo.updated_at)
                : null;

              return (
                <li className="todo-item" key={todo.id}>
                  <div className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleDone(todo.id, !todo.done)}
                    />

                    <div className="todo-main" style={{ flexGrow: 1 }}>
                      {editingId === todo.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTextSave(todo.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                            style={{ flexGrow: 1 }}
                          />
                          <button onClick={() => handleTextSave(todo.id)}>
                            Save
                          </button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`todo-text ${todo.done ? "done" : ""}`}
                            style={{ fontWeight: 500 }}
                          >
                            {todo.text}
                          </div>

                          {todo.tags?.length > 0 && (
                            <div className="tag-container">
                              {todo.tags.map((tag, idx) => {
                                const cls =
                                  tagClassMap[tag.toLowerCase()] || "";
                                return (
                                  <span key={idx} className={`tag-pill ${cls}`}>
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {todo.deadline && (
                            <div
                              className="tooltip"
                              title={`Due: ${new Date(
                                todo.deadline
                              ).toLocaleString()}`}
                            >
                              Deadline:{" "}
                              {new Date(todo.deadline).toLocaleString()}
                            </div>
                          )}

                          <div className="todo-meta">
                            <div
                              className="tooltip"
                              title={`Created: ${created.toLocaleString()}`}
                            >
                              Created{" "}
                              {formatDistanceToNow(created, {
                                addSuffix: true,
                              })}
                            </div>
                            {updated && updated !== created && (
                              <div
                                className="tooltip"
                                title={`Updated: ${updated.toLocaleString()}`}
                                style={{ fontStyle: "italic", color: "#888" }}
                              >
                                Updated{" "}
                                {formatDistanceToNow(updated, {
                                  addSuffix: true,
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => startEditing(todo.id, todo.text)}
                        title="Edit todo"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          color: "#555",
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        title="Delete todo"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          color: "crimson",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default Todos;
