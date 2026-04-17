import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";
import VerifyMFA from "./verfiyMFA.jsx";
import { generateUserKeys, encryptData, decryptData } from "./utils/crypto";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("login");

  const [userPrivateKey, setUserPrivateKey] = useState("");
  const [tempKeys, setTempKeys] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");

  // 1. App Initialization logic
  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);

      if (params.has("userId")) {
        setView("mfa");
        setLoading(false);
        return;
      }

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
        console.error("Auth check failed:", err);
        setView("login");
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // 2. Fetch tasks for dashboard
  useEffect(() => {
    if (view === "dashboard" && user) {
      fetch("http://localhost:3001/api/tasks", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setTasks(data);
        })
        .catch((err) => console.error("Fetch error:", err));
    }
  }, [view, user]);

  // 3. Action Handlers
  const handleGenerateKeys = async () => {
    const keys = await generateUserKeys();
    await fetch("http://localhost:3001/auth/update-public-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ publicKey: keys.publicKeyPem }),
    });
    setTempKeys(keys);
    setUser({ ...user, public_key: keys.publicKeyPem });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      // This reads the raw text exactly as it is in the file
      setUserPrivateKey(content.trim());
    };
    reader.readAsText(file);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!user.public_key) return alert("Generate keys first!");

    const encryptedTitle = encryptData(taskName, user.public_key);

    const response = await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: encryptedTitle, deadline: deadline }),
    });

    if (response.ok) {
      const savedTask = await response.json();
      setTasks((prev) => [...prev, savedTask]);
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

  const decryptTask = (encryptedTitle) => {
    if (!userPrivateKey) return "🔒 Locked";
    let cleanKey = userPrivateKey.trim();

    return decryptData(encryptedTitle, cleanKey);
  };

  // 4. Render Logic
  if (loading)
    return <div className="loading-screen">Loading Secure Session...</div>;

  return (
    <div className="container">
      {view === "login" && <Login />}

      {view === "mfa" && (
        <VerifyMFA
          onVerified={(userData) => {
            setUser(userData);
            setView("dashboard");
            window.history.replaceState({}, document.title, "/");
          }}
        />
      )}

      {/* One-Time Key Display Modal */}
      {tempKeys && (
        <div className="modal-overlay">
          <div className="modal-content key-modal">
            <h2>⚠️ Save Your Private Key</h2>
            <p>Copy this key. If you lose it, your tasks are gone forever.</p>
            <textarea
              readOnly
              value={tempKeys.privateKeyPem}
              rows={10}
              className="key-display"
            />
            <button onClick={() => setTempKeys(null)} className="create-btn">
              I have saved my key
            </button>
          </div>
        </div>
      )}

      {view === "dashboard" && user && (
        <main className="center-layout">
          <header className="app-header">
            <div className="user-profile">
              <img src={user.avatar_url} alt="avatar" className="avatar" />
              <span>{user.display_name}</span>
            </div>
            <h1>Secure Tasks</h1>
            <button onClick={() => setShowModal(true)} className="add-btn">
              Add Task (+)
            </button>
          </header>

          <section className="crypto-controls">
            {!user.public_key ? (
              <button onClick={handleGenerateKeys} className="gen-btn">
                Initialize Encryption
              </button>
            ) : !userPrivateKey ? (
              <div className="key-prompt">
                <p>
                  To view tasks, upload your <strong>RSAKey.pem</strong> file:
                </p>

                <label className="file-upload-label">
                  <span>📁 Choose Key File</span>
                  <input
                    type="file"
                    accept=".pem,.txt"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>

                {/* Optional: Show a small hint if key is loaded */}
                {userPrivateKey && (
                  <p className="key-loaded-hint">✅ Key loaded</p>
                )}

                <p>or</p>

                <label className="key-input-label">                                  <textarea
                  onChange={(e) => setUserPrivateKey(e.target.value)}
                  placeholder="Paste PEM key here..."
                /></label>
                
              </div>
            ) : (
              <p className="status-locked">🔓 Database decrypted locally.</p>
            )}
          </section>

          <section className="tasks-view">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <div className="task-info">
                  <span className={task.completed ? "done" : ""}>
                    {userPrivateKey
                      ? decryptData(task.title, userPrivateKey)
                      : "🔒 " + task.title.substring(0, 15) + "..."}
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
            ))}
          </section>
        </main>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleCreateTask}>
              <h2>New Task</h2>
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Task Title"
                required
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <div className="modal-actions">
                <button type="submit" className="create-btn">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Cancel
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
