import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:3001/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskName, deadline: deadline }),
    });

    if (response.ok) {
      const savedTask = await response.json();
      setTasks([...tasks, savedTask]);

      setTaskName("");
      setDeadline("");
      setShowModal(false);
    }
  };

  const toggleTask = async (id) => {
    const taskToToggle = tasks.find((t) => t.id === id);
    const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
      method: "PATCH",
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
    });

    if (response.ok) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  return (
    <div className="container">
      <main className="center-layout">
        <header className="app-header">
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
                {/* Add the Delete Button here */}
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

      {/* Modal Overlay */}
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
