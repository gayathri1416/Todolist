# Ex03 To-Do List using JavaScript
## Date:17.11.2026

## AIM
To create a To-do Application with all features using JavaScript.

## ALGORITHM
### STEP 1
Build the HTML structure (index.html).

### STEP 2
Style the App (style.css).

### STEP 3
Plan the features the To-Do App should have.

### STEP 4
Create a To-do application using Javascript.

### STEP 5
Add functionalities.

### STEP 6
Test the App.

### STEP 7
Open the HTML file in a browser to check layout and functionality.

### STEP 8
Fix styling issues and refine content placement.

### STEP 9
Deploy the website.

### STEP 10
Upload to GitHub Pages for free hosting.

## PROGRAM



## Backend\controllers\authController.js
```js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const register = (req, res) => {
  const { name, email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Please enter your name.",
    });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address.",
    });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Server error.",
        });
      }
      if (result.length > 0) {
        return res.status(409).json({
          message: "User already exists. Please login.",
        });
      }
      try {
        const hashedPassword = await bcrypt.hash(
          password,
          10
        );
        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, hashedPassword],
          (err) => {
            if (err) {
              return res.status(500).json({
                message: "Server error.",
              });
            }
            return res.status(201).json({
              message:
                "Registration successful. Please login.",
            });
          }
        );
      } catch (error) {
        return res.status(500).json({
          message: "Server error.",
        });
      }
    }
  );
};
const login = (req, res) => {
  const { email, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Server error.",
        });
      }
      if (result.length === 0) {
        return res.status(404).json({
          message:
            "Account not found. Please register first.",
        });
      }
      const user = result[0];
      try {
        const valid = await bcrypt.compare(
          password,
          user.password
        );
        if (!valid) {
          return res.status(401).json({
            message: "Invalid email or password.",
          });
        }
        const token = jwt.sign(
          { id: user.id },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        return res.status(200).json({
          message: `Welcome, ${user.name}!`,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      } catch (error) {
        return res.status(500).json({
          message: "Server error.",
        });
      }
    }
  );
};
module.exports = {
  register,
  login,
};
```

## Backend/config/db.js
```js
const mysql = require("mysql2");
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: true,
  },
});
db.connect((err) => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("TiDB Connected");
  }
});
module.exports = db;
```
## Backend\controllers\taskController.js
```js
const db = require("../config/db");
const addTask = (req, res) => {
  const userId = req.user.id;
  const { title, description, due_date, status } = req.body;
  db.query(
    "INSERT INTO tasks (user_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)",
    [userId, title, description, due_date, status],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Task added" });
    }
  );
};
const getAllTasks = (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT * FROM tasks WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json(result);
    }
  );
};
const updateTask = (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { title, description, due_date, status } = req.body;
  db.query(
    "UPDATE tasks SET title=?, description=?, due_date=?, status=? WHERE id=? AND user_id=?",
    [title, description, due_date, status, taskId, userId],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Task updated" });
    }
  );
};
const deleteTask = (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  db.query(
    "DELETE FROM tasks WHERE id=? AND user_id=?",
    [taskId, userId],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "Task deleted" });
    }
  );
};
module.exports = {
  addTask,
  getAllTasks,
  updateTask,
  deleteTask,
};
```
## Backend\middleware\authMiddleware.js
```js
const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "No token" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
module.exports = authMiddleware;
```
## Backend\routes\authRoutes.js
```js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
router.post("/register", register);
router.post("/login", login);
module.exports = router;
```
## Backend\routes\taskRoutes.js
```js
const express = require("express");
const router = express.Router();
const {
  addTask,
  getAllTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const auth = require("../middleware/authMiddleware");
console.log({
  addTask,
  getAllTasks,
  updateTask,
  deleteTask,
  auth,
});
router.get("/", auth, getAllTasks);
router.post("/", auth, addTask);
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
module.exports = router;
```
## Backend\server.js
```js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.get("/", (req, res) => {
  res.send("TaskHub Backend Running 🚀");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
```
## Frontend\index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
rel="stylesheet"
/>
    <title>TaskHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```
## Frontend\src\App.jsx
```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
```
## Frontend\src\dashboard.css
```css
* {
  margin:0; padding:0; box-sizing:border-box;
}
html,body,#root {
  min-height:100%; width:100%;
}
.dashboard-container {
  min-height:100vh; width:100%; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7); font-family:"Poppins",sans-serif; padding:2rem; box-sizing:border-box;
}
.dashboard-card {
  background:rgba(255,255,255,0.95); border-radius:20px; box-shadow:3px 3px 10px rgba(19,1,1,0.6),0 0 10px rgba(0,0,0,0.7); padding:2rem; max-width:800px; margin:25px auto; animation:fadeIn 0.8s ease-in-out;
}
.dashboard-title {
  font-size:2.4rem; font-weight:900; margin-bottom:1.5rem; background:linear-gradient(180deg,#120e03be,#ff0088,#06fdb7f4); background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent;
  text-shadow:2px 2px 8px rgba(0,0,0,0.167);
}
.dashboard-stats {
  display:flex; flex-direction:column; gap:10px;
}
.dashboard-stats p {
  font-size:16px; font-weight:500;
}
.overdue-banner {
  margin:20px 0; padding:14px; background:#ffebee; color:#c62828; border:2px solid #ef5350; border-radius:12px; font-weight:700; text-align:center;
}
.near-due-section {
  margin-top:2rem;
}
.near-due-section h3 {
  margin-bottom:1rem;
}
.near-due-card {
  border:2px solid #10100d; border-radius:12px; padding:1rem; margin-bottom:1rem; background:rgba(19,251,239,0.183); transition:transform 0.2s ease;
}
.near-due-card:hover {
  transform:translateY(-3px);
}
.near-due-card h4 {
  margin-bottom:0.5rem;
}
.near-due-card p {
  margin-bottom:0.5rem;
}
.due-label {
  display:inline-block; margin-top:10px; padding:6px 12px; border-radius:999px; color:white; font-size:13px; font-weight:600;
}
.due-label.today {
  background:#e53935;
}
.due-label.tomorrow {
  background:#fb8c00;
}
.due-label.day-after {
  background:#1e88e5;
}
.due-label.overdue {
  background:#c62828; animation:pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    transform:scale(1); box-shadow:0 0 0 0 rgba(198,40,40,0.6);
  }
  70% {
    transform:scale(1.05); box-shadow:0 0 0 10px rgba(198,40,40,0);
  }
  100% {
    transform:scale(1); box-shadow:0 0 0 0 rgba(198,40,40,0);
  }
}
@keyframes fadeIn {
  from {
    opacity:0; transform:translateY(20px);
  }
  to {
    opacity:1; transform:translateY(0);
  }
}
@media (max-width:768px) {
  .dashboard-container {
    min-height:100vh; width:100%; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7); padding:20px; box-sizing:border-box;
  }
  .dashboard-card {
    width:100%; padding:25px; margin:20px auto;
  }
  .dashboard-title {
    font-size:2rem; text-align:center;
  }
  .dashboard-stats p {
    font-size:14px;
  }
  .near-due-section h3 {
    font-size:18px; text-align:center;
  }
  .near-due-card {
    padding:15px;
  }
  .near-due-card h4 {
    font-size:16px;
  }
  .near-due-card p {
    font-size:14px;
  }
  .due-label {
    font-size:12px; padding:5px 10px;
  }
}
```
## Frontend\src\index.css
```css
html,body,#root {
  margin:0; padding:0; width:100%; min-height:100vh;
}
```
## Frontend\src\login.css
```css
.login-container {
  display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(190deg,#02626ea7,#04f8c368,#02626ea7); font-family:"Poppins",sans-serif;
}
.login-card {
  background:rgba(255,255,255,0.85); padding:3rem 2.5rem; border-radius:20px; box-shadow:3px 3px 10px rgba(19,1,1,0.6),0 0 2px white,;
  /* deep dark shadow */
  0 0 10px rgba(0,0,0,0.7);
  /* soft white glow */
  width:100%; max-width:440px; text-align:center; animation:fadeIn 0.8s ease-in-out;
}
.login-card h1 {
  font-size:2.8rem; font-weight:900; margin-bottom:0.5rem; background:linear-gradient(180deg,#120e03be,#ff0088,#06fdb7f4); background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent;
  text-shadow:2px 2px 8px rgba(0,0,0,0.2);
}
.subtitle {
  margin-bottom:2rem; color:#333; font-size:1.05rem; font-weight:500;
}
.login-card input[type="email"],.login-card input[type="password"],.login-card input[type="text"] {
  width:100%; padding:1rem; margin-bottom:1.2rem; border:none; border-radius:12px; font-size:1rem; background:rgba(255,255,255,0.47); box-shadow:inset 0 2px 2px rgba(0,0,0,0.75);
  transition:all 0.3s ease; box-sizing:border-box;
  /* ensures equal sizing */
}
.login-card input:focus {
  background:#fff; box-shadow:0 0 6px rgb(131,0,131); outline:none;
}
.password-box {
  position:relative; width:100%;
}
.password-box input {
  width:100%; padding-right:2.5rem;
  /* space for eye icon */
}
.eye-btn {
  position:absolute; right:12px;
  /* flush at end */
  transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:0.5rem; color:#444; transition:transform 0.2s ease,color 0.3s ease;
}
.eye-btn:hover {
  transform:translateY(-50%) scale(1.2); color:#4dd4ee86;
}
.login-btn {
  width:100%; padding:1rem; background:#060605; color:#ffffff; border:none; border-radius:12px; font-size:1.2rem; font-weight:700;
  cursor:pointer; transition:transform 0.2s ease,box-shadow 0.3s ease; box-shadow:0 6px 15px rgba(0,0,0,0.3);
}
.login-btn:hover {
  transform:translateY(-3px); box-shadow:0 10px 12px rgba(239,183,62,0.6);
}
@media (max-width:768px) {
  .login-container {
    min-height:100vh; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7); padding:15px; box-sizing:border-box;
  }
  .login-card {
    width:100%; max-width:100%; padding:25px 20px; margin:0 auto; border-radius:15px; box-sizing:border-box;
  }
  .login-card h1 {
    font-size:2rem;
  }
}
```
## Frontend\src\main.jsx
```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";
registerSW({ immediate: true });
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```
## Frontend\src\navbar.css
```css
.navbar {
  display:flex; align-items:center; gap:15px; padding:15px 25px; background:rgba(0,128,128,0.586); box-shadow:0px 2px 3px rgba(255,255,255,0.3);
}
.nav-btn {
  padding:12px 24px; border:none; border-radius:14px; text-decoration:none; background:#2b2f5b; color:#7fd4bca9; font-size:16px; font-weight:700;
  cursor:pointer; transition:all 0.3s ease;
}
.nav-btn:hover {
  transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.3); color:#2ab83da4;
}
.logout-btn {
  margin-left:auto; background:#34355c; color:#c1d61f; padding:12px 28px; border:none; border-radius:18px; font-size:16px; font-weight:700;
  cursor:pointer; transition:all 0.3s ease;
}
.logout-btn:hover {
  transform:scale(1.05); box-shadow:0 0 8px rgba(218,233,5,0.8),0 0 20px rgba(180,130,143,0.7),0 0 40px rgba(194,203,19,0.6),0 0 70px rgba(0,162,255,0.35); color:#3a2fde;
}
.nav-btn.active {
  background:#40457c;
}
@media (max-width:768px) {
  .navbar {
    padding:12px; gap:10px;
  }
  .nav-btn,.logout-btn {
    padding:10px 18px; font-size:14px;
  }
}
@media (max-width:768px) {
  .navbar {
    flex-wrap:wrap; gap:10px; padding:10px;
  }
  .nav-btn {
    flex:1; text-align:center;
  }
  .logout-btn {
    margin-left:0;
  }
}
```
## Frontend\src\pages\Dashboard.jsx
```jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import "../dashboard.css";
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");
  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        "https://tasktracking-i6et.onrender.com/api/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks(res.data);
    } catch (err) {
      console.log("Error fetching tasks:", err);
    }
  };
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);
  const getDateOnly = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };
  const getDueLabel = (dueDate) => {
    const today = getDateOnly(new Date());
    const due = getDateOnly(dueDate);
    const diffDays = Math.round(
      (due - today) / (1000 * 60 * 60 * 24)
    );
    switch (diffDays) {
      case 0:
        return {
          text: "Today",
          className: "today",
        };
      case 1:
        return {
          text: "Tomorrow",
          className: "tomorrow",
        };
      case 2:
        return {
          text: "Day After Tomorrow",
          className: "day-after",
        };
      default:
        return null;
    }
  };
  const getTaskStatus = (task) => {
    if (!task.due_date) return null;
    const today = getDateOnly(new Date());
    const due = getDateOnly(task.due_date);
    const diffDays = Math.round(
      (due - today) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""
          }`,
        className: "overdue",
      };
    }
    return getDueLabel(task.due_date);
  };
  const total = tasks.length;
  const completed = tasks.filter(
    (t) => t.status === "Completed" || t.progress === 100
  ).length;
  const pending = tasks.filter(
    (t) => t.status !== "Completed" && t.progress !== 100
  ).length;
  const progress = total ? (completed / total) * 100 : 0;
  const alertTasks = tasks
    .filter((t) => {
      if (!t.due_date) return false;
      if (t.status === "Completed" || t.progress === 100) {
        return false;
      }
      return getTaskStatus(t) !== null;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const overdueCount = alertTasks.filter(
    (t) => getTaskStatus(t)?.className === "overdue"
  ).length;
  const allCompleted =
    tasks.length > 0 &&
    tasks.every(
      (t) => t.status === "Completed" || t.progress === 100
    );
  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-card">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-stats">
          <p>Total Tasks: {total}</p>
          <p>Completed: {completed}</p>
          <p>Pending: {pending}</p>
          <p>{Math.round(progress)}% Completed</p>
        </div>
        <br />
        <ProgressBar value={progress} />
        {overdueCount > 0 && (
          <div className="overdue-banner">
            ⚠️ You have {overdueCount} overdue task
            {overdueCount > 1 ? "s" : ""}!
          </div>
        )}
        {!allCompleted && (
          <div className="near-due-section">
            <h3>Task Alerts</h3>
            {alertTasks.length === 0 ? (
              <p>No urgent tasks!</p>
            ) : (
              alertTasks.map((t) => {
                const statusInfo = getTaskStatus(t);
                return (
                  <div
                    key={t._id || t.id}
                    className="near-due-card"
                  >
                    <h4>{t.title}</h4>
                    <p>{t.description}</p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {formatDate(t.due_date)}
                    </p>
                    <span
                      className={`due-label ${statusInfo.className}`}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default Dashboard;
```
## Frontend\src\pages\Login.jsx
```jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../login.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const handleLogin = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    try {
      const res = await axios.post(
        "https://tasktracking-i6et.onrender.com/api/auth/login",
        loginData
      );
      if (!res.data.token) {
        alert("No token received.");
        return;
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );
      localStorage.setItem(
        "userName",
        res.data.user?.name || ""
      );
      alert(`Welcome, ${res.data.user?.name}!`);
navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed.";
      alert(message);
    }
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>TaskHub</h1>
        <p className="subtitle">
          Welcome. Sign in to continue.
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                email: e.target.value,
              })
            }
          />
          <div className="password-box">
            <input
              type={
                showPassword ? "text" : "password"
              }
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </button>
          </div>
          <button
            type="submit"
            className="login-btn"
          >
            Login
          </button>
        </form>
        <p className="register-text">
          Don't have an account?{" "}
          <span
            className="register-link"
            onClick={() => navigate("/register")}
          >
            Register Here
          </span>
        </p>
      </div>
    </div>
  );
}
export default Login;
```
## Frontend\src\pages\Register.jsx
```jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../register.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] =
    useState(false);
  const [registerData, setRegisterData] =
    useState({
      name: "",
      email: "",
      password: "",
    });
  const handleRegister = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!registerData.name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!emailRegex.test(registerData.email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!passwordRegex.test(registerData.password)) {
      alert(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }
    try {
      await axios.post(
        "https://tasktracking-i6et.onrender.com/api/auth/register",
        registerData
      );
      alert(
        "Registration successful. Please login."
      );
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed.";
      alert(message);
    }
  };
  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Register</h1>
        <form onSubmit={handleRegister}>
          <input
            placeholder="Name"
            value={registerData.name}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                name: e.target.value,
              })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                email: e.target.value,
              })
            }
          />
          <div className="password-box">
            <input
              type={
                showPassword ? "text" : "password"
              }
              placeholder="Password"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  password: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </button>
          </div>
          <small
            style={{
              display: "block",
              marginBottom: "15px",
              color: "#666",
            }}
          >
            Password must contain at least 8
            characters, including uppercase,
            lowercase, number, and special
            character.
          </small>
          <button
            type="submit"
            className="register-btn"
          >
            Register
          </button>
        </form>
        <p className="register-text">
          Already registered?{" "}
          <span
            className="register-link"
            onClick={() => navigate("/")}
          >
            Login Here
          </span>
        </p>
      </div>
    </div>
  );
}
export default Register;
```
## Frontend\src\pages\Tasks.jsx
```jsx
import { useEffect, useState } from "react";
import axios from "axios";
import TaskNavbar from "../TaskNavbar";
import "../tasks.css";
function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const token = localStorage.getItem("token");
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending",
  });
  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        "https://tasktracking-i6et.onrender.com/api/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks(res.data);
    } catch (err) {
      console.log("Error fetching tasks:", err);
    }
  };
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);
  const addTask = async () => {
    try {
      await axios.post(
        "https://tasktracking-i6et.onrender.com/api/tasks",
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      resetForm();
      fetchTasks();
    } catch (err) {
      console.log("Error adding task:", err);
    }
  };
  const updateTask = async () => {
    try {
      await axios.put(
        `https://tasktracking-i6et.onrender.com/api/tasks/${editId}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      resetForm();
      fetchTasks();
    } catch (err) {
      console.log("Error updating task:", err);
    }
  };
  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `https://tasktracking-i6et.onrender.com/api/tasks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTasks();
    } catch (err) {
      console.log("Error deleting task:", err);
    }
  };
  const handleEdit = (task) => {
    setTaskData({
      title: task.title,
      description: task.description,
      due_date: task.due_date
        ? task.due_date.split("T")[0]
        : "",
      status: task.status,
    });
    setEditId(task._id || task.id);
    setIsEdit(true);
    setShowForm(true);
  };
  const resetForm = () => {
    setTaskData({
      title: "",
      description: "",
      due_date: "",
      status: "Pending",
    });
    setShowForm(false);
    setIsEdit(false);
    setEditId(null);
  };
  const getDateOnly = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const formatDate = (date) => {
    if (!date) return "No date";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid date";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };
  const getTaskClass = (task) => {
    if (
      task.status === "Completed" ||
      task.progress === 100
    ) {
      return "completed";
    }
    if (!task.due_date) {
      return "pending";
    }
    const today = getDateOnly(new Date());
    const due = getDateOnly(task.due_date);
    const diffDays = Math.round(
      (due - today) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays === 2) return "day-after";
    return "pending";
  };
  const getTaskLabel = (task) => {
    if (
      task.status === "Completed" ||
      task.progress === 100
    ) {
      return "Completed";
    }
    if (!task.due_date) {
      return "No Due Date";
    }
    const today = getDateOnly(new Date());
    const due = getDateOnly(task.due_date);
    const diffDays = Math.round(
      (due - today) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""
        }`;
    }
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    if (diffDays === 2) return "Due Day After Tomorrow";
    return "Pending";
  };
  return (
    <div className="tasks-container">
      <TaskNavbar />
      <div className="tasks-card">
        <h1 className="tasks-title">My Tasks</h1>
        <button
          className="nav-btn add-task-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close Form" : "Add Task"}
        </button>
        {showForm && (
          <div className="task-form">
            <input
              placeholder="Title"
              value={taskData.title}
              onChange={(e) =>
                setTaskData({
                  ...taskData,
                  title: e.target.value,
                })
              }
            />
            <input
              placeholder="Description"
              value={taskData.description}
              onChange={(e) =>
                setTaskData({
                  ...taskData,
                  description: e.target.value,
                })
              }
            />
            <input
              type="date"
              value={taskData.due_date}
              onChange={(e) =>
                setTaskData({
                  ...taskData,
                  due_date: e.target.value,
                })
              }
            />
            <select
              value={taskData.status}
              onChange={(e) =>
                setTaskData({
                  ...taskData,
                  status: e.target.value,
                })
              }
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <button
              className="nav-btn"
              onClick={isEdit ? updateTask : addTask}
            >
              {isEdit ? "Update Task" : "Add Task"}
            </button>
            <button
              className="logout-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        )}
        {tasks.map((t) => (
          <div
            key={t._id || t.id}
            className={`task-item ${getTaskClass(t)}`}
          >
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <p>
              <strong>Due Date:</strong>{" "}
              {formatDate(t.due_date)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {getTaskLabel(t)}
            </p>
            <div className="task-actions">
              <button
                className="nav-btn"
                onClick={() => handleEdit(t)}
              >
                Edit
              </button>
              <button
                className="logout-btn"
                onClick={() =>
                  deleteTask(t._id || t.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Tasks;
```
## Frontend\src\register.css
```css
.register-container {
  display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7); font-family:"Poppins",sans-serif;
}
.register-card {
  background:rgba(255,255,255,0.95); padding:3rem 2.5rem; border-radius:20px; box-shadow:3px 3px 10px rgba(19,1,1,0.6),0 0 10px rgba(0,0,0,0.7); width:100%; max-width:440px; text-align:center; animation:fadeIn 0.8s ease-in-out;
}
.register-card h1 {
  font-size:2.8rem; font-weight:900; margin-bottom:1.5rem; background:linear-gradient(190deg,#120e03be,#ff0088,#06fdb7f4); background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent; text-shadow:2px 2px 8px rgba(0,0,0,0.2);
}
.register-card input {
  width:100%; padding:1rem; margin-bottom:1.2rem; border:none; border-radius:12px; font-size:1rem; background:rgba(255,255,255,0.47); box-shadow:inset 2px 2px 6px rgba(0,0,0,0.75);
  transition:all 0.3s ease; box-sizing:border-box;
}
.register-card input:focus {
  background:#fff; box-shadow:0 0 8px rgb(222,30,248); outline:none;
}
.password-box {
  position:relative; width:100%;
}
.password-box input {
  width:100%; padding-right:2.5rem;
}
.eye-btn {
  position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1.2rem;
  color:#444; transition:transform 0.2s ease,color 0.3s ease;
}
.eye-btn:hover {
  transform:translateY(-50%) scale(1.2); color:#060605;
}
.register-btn {
  width:100%; padding:1rem; background:#060605; color:#ffffff; border:none; border-radius:12px; font-size:1.2rem; font-weight:700;
  cursor:pointer; transition:transform 0.2s ease,box-shadow 0.3s ease; box-shadow:0 6px 15px rgba(0,0,0,0.3);
}
.register-btn:hover {
  transform:translateY(-3px); box-shadow:0 10px 12px rgba(239,183,62,0.6);
}
.register-text {
  margin-top:2rem; font-size:1rem; color:#444;
}
.register-link {
  color:#ff416c; font-weight:700; cursor:pointer; transition:color 0.3s ease,text-shadow 0.3s ease;
}
.register-link:hover {
  color:#ff9a00; text-shadow:0 0 8px rgba(255,154,0,0.6);
}
@keyframes fadeIn {
  from {
    opacity:0; transform:translateY(20px);
  }
  to {
    opacity:1; transform:translateY(0);
  }
}
@media (max-width:480px) {
  .register-card {
    padding:2rem 1.5rem;
  }
  .register-card h1 {
    font-size:2.2rem;
  }
}
@media (max-width:768px) {
  .register-container {
    padding:15px; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7);
  }
  .register-card {
    width:95%; max-width:100%; padding:25px 20px;
  }
  .register-card h1 {
    font-size:2rem;
  }
  .subtitle {
    font-size:14px;
  }
  .register-card input {
    width:100%; padding:12px; font-size:14px;
  }
  .password-box {
    width:100%;
  }
  .eye-btn {
    right:12px; font-size:18px;
  }
  .register-btn {
    width:100%; padding:12px; font-size:15px;
  }
  .login-text {
    font-size:14px;
  }
}
@media (max-width:768px) {
  .register-container {
    min-height:100vh; padding:15px; box-sizing:border-box;
  }
  .register-card {
    width:100%; max-width:100%; padding:25px 20px; margin:0 auto; border-radius:15px; box-sizing:border-box;
  }
  .register-card h1 {
    font-size:2rem;
  }
}
```
## Frontend\src\taskNavbar.css
```css
.tasks-navbar {
  display:flex; align-items:center; padding:15px 25px; background:rgba(0,128,128,0.586); box-shadow:0px 2px 3px rgba(255,255,255,0.3);
}
.dashboard-btn {
  margin-right:auto;
}
.logout-btn {
  margin-left:auto;
}
.nav-btn {
  padding:12px 24px; border-radius:14px; border:none; font-size:16px; font-weight:700; cursor:pointer; transition:all 0.3s ease;
}
@media (max-width:768px) {
  .tasks-navbar {
    display:flex; justify-content:space-between; gap:15px; width:100%;
  }
  .dashboard-btn,.logout-btn {
    width:48%;
  }
}
```
## Frontend\src\TaskNavbar.jsx
```jsx
import { useNavigate } from "react-router-dom";
import "./taskNavbar.css";
function TaskNavbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };
  return (
    <nav className="tasks-navbar">
      <button
        onClick={() => navigate("/dashboard")}
        className="nav-btn dashboard-btn"
      >
        Go Back To Dashboard
      </button>
      <button
        onClick={handleLogout}
        className="nav-btn logout-btn"
      >
        Logout
      </button>
    </nav>
  );
}
export default TaskNavbar;
```
## Frontend\src\tasks.css
```css
* {
  margin:0; padding:0; box-sizing:border-box;
}
html,body,#root {
  width:100%; min-height:100%; overflow-x:hidden;
}
.tasks-container {
  min-height:100vh; width:100%; background:linear-gradient(170deg,#02626ea7,#04f8f468,#02626ea7); font-family:"Poppins",sans-serif; padding:30px; box-sizing:border-box;
}
.tasks-card {
  width:100%; max-width:900px; margin:30px auto; background:rgba(255,255,255,0.95); border-radius:20px; padding:30px; box-shadow:0 0 15px rgba(12,8,9,0.4),0 0 30px rgba(255,77,122,0.2);
}
.tasks-title {
  text-align:center; font-size:2.5rem; font-weight:800; margin-bottom:20px; background:linear-gradient(180deg,#120e03be,#ff0088,#06fdb7f4); background-clip:text; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  text-shadow:2px 2px 8px rgba(0,0,0,0.167);
}
.add-task-btn {
  margin-bottom:20px;
}
.task-form {
  display:flex; flex-direction:column; gap:15px; margin-bottom:25px;
}
.task-form input,.task-form select {
  width:100%; padding:14px; border:none; border-radius:12px; background:#f5f5f5; font-size:15px; box-shadow:inset 2px 2px 6px rgba(0,0,0,0.15);
}
.task-form input:focus,.task-form select:focus {
  outline:2px solid #04cfd6;
}
.task-item {
  width:100%; background:white; border:2px solid #cbd5e1; border-left:8px solid #cbd5e1; border-radius:18px; padding:25px; margin:25px 0; overflow-wrap:break-word;
  word-break:break-word; box-shadow:0 4px 12px rgba(0,0,0,0.1); transition:transform 0.3s ease,box-shadow 0.3s ease;
}
.task-item:hover {
  transform:translateY(-3px); box-shadow:0 8px 18px rgba(0,0,0,0.15);
}
.task-item h3 {
  margin-bottom:12px; color:#1e293b; font-size:1.3rem;
}
.task-item p {
  margin:8px 0; color:#334155; line-height:1.5;
}
.task-item.completed {
  border-color:#16a34a; border-left-color:#15803d; background:#f0fdf4;
}
.task-item.overdue {
  border-color:#a90404; border-left-color:#aa0404; background:#fef2f2;
}
.task-item.today {
  border-color:#ea580c; border-left-color:#c2410c; background:#fff7ed;
}
.task-item.tomorrow {
  border-color:#f59e0b; border-left-color:#d97706; background:#fffbeb;
}
.task-item.day-after {
  border-color:#2563eb; border-left-color:#1d4ed8; background:#eff6ff;
}
.task-item.pending {
  border-color:#64748b; border-left-color:#475569; background:#f8fafc;
}
.task-actions {
  display:flex; gap:15px; margin-top:20px;
}
.nav-btn,.logout-btn {
  padding:12px 24px; border:none; border-radius:14px; background:#fefb55; color:#0b0b0a; font-size:15px; font-weight:700; cursor:pointer;
  transition:all 0.3s ease;
}
.nav-btn:hover,.logout-btn:hover {
  transform:translateY(-2px); box-shadow:0 0 4px rgb(17,17,14),0 2px 4px rgb(12,11,9); color:rgb(119,2,177);
}
@media (max-width:768px) {
  .tasks-container {
    padding:10px;
  }
  .tasks-card {
    width:100%; max-width:100%; margin:10px auto; padding:15px; border-radius:15px;
  }
  .tasks-title {
    font-size:2rem;
  }
  .task-form input,.task-form select {
    padding:12px; font-size:14px;
  }
  .task-item {
    padding:18px; margin:15px 0;
  }
  .task-item h3 {
    font-size:1.1rem;
  }
  .task-item p {
    font-size:14px;
  }
  .task-actions {
    flex-direction:column; width:100%; gap:10px;
  }
  .nav-btn,.logout-btn {
    width:100%; padding:12px;
  }
}
```


## OUTPUT

## OUTPUT

### 1. Login Page
![Login Page](<Screenshot 2026-07-05 150121.png>)
### 2. Register Page
![Dashboard](<Screenshot 2026-07-05 150137.png>)
### 3. Dashboard
![Tasks Page](<Screenshot 2026-07-05 150743.png>)
![Screenshot 4](<Screenshot 2026-07-05 150809.png>)
### 4.Task page
![Latest Screenshot](<Screenshot 2026-11-17 171359.png>)
### 5. Sample Tasks

![Screenshot 5](<Screenshot 2026-07-05 151652.png>)
![Screenshot 6](<Screenshot 2026-07-05 151715.png>)


## RESULT
The program for creating To-do list using JavaScript is executed successfully.
![alt text](<../Screenshot 2026-07-05 150121.png>)