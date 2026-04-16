import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import VerifyMFA from "./verfiyMFA.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login");

  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);

      // 1. Handle MFA View
      if (params.has("userId")) {
        setView("mfa");
        setLoading(false);
        return;
      }

      // 2. Check for active session
      try {
        const res = await fetch("http://localhost:3001/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setView("dashboard");
        } else {
          setView("login");
        }
      } catch (err) {
        setView("login");
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []); // ONLY one effect for initialization
  useEffect(() => {
    if (view === "dashboard" && user) {
      fetch("http://localhost:3001/api/tasks", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => {
          if (res.status === 401) {
            console.error("Session lost - 401");
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) setTasks(data);
        })
        .catch((err) => console.error("Fetch error:", err));
    }
  }, [view, user]);

  if (loading)
    return <div className="loading-screen">Loading Secure Session...</div>;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // <--- ADD THIS
      body: JSON.stringify({ title: taskName, deadline: deadline }),
    });

    if (response.ok) {
      const savedTask = await response.json();
      // Use functional state update to be safe
      setTasks((prevTasks) => [...prevTasks, savedTask]);
      setTaskName("");
      setDeadline("");
      setShowModal(false);
    }
  };

  const toggleTask = async (id) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !taskToToggle.completed }),
    });

    if (response.ok) {
      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
    }
  };

  const deleteTask = async (id) => {
    const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  return (
    <div className="container">
      {view === "login" && <Login />}

      {view === "mfa" && (
        <VerifyMFA
          onVerified={(userData) => {
            setUser(userData); // Set the user object globally
            setView("dashboard"); // Switch view
            // Clean up the URL
            window.history.replaceState({}, document.title, "/");
          }}
        />
      )}

      {view === "dashboard" && user && (
        <main className="center-layout">
          <header className="app-header">
            <div className="user-profile">
              <img src={user.avatar_url} alt="avatar" className="avatar" />
              <span>{user.display_name}</span>
            </div>
            <h1>Todo App</h1>
            <button onClick={() => setShowModal(true)} className="add-btn">
              Add Task (+)
            </button>
          </header>

          <section className="tasks-view">
            {tasks.length === 0 ? (
              <p className="empty-msg">No tasks yet. Click the button above!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <div className="task-info">
                    <span className={task.completed ? "done" : ""}>
                      {task.title}
                    </span>
                    <small>
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </small>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </section>
        </main>
      )}

      {/* Modal Overlay Logic remains same */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Enter Task Details</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title:</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Fix Docker Config"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline:</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
