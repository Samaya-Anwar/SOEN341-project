import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Handle login
        const response = await axios.post("http://localhost:5001/api/login", { username, password });

        // Store token, username, and role in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);

        console.log("Stored role in localStorage:", response.data.role); // Debugging
        alert(`Login successful! Your role is ${response.data.role}`);
        navigate("/chat"); // Redirect to chat
      } else {
        // Handle signup
        const signupResponse = await axios.post("http://localhost:5001/api/signup", { username, password });

        alert(`Signup successful! You have been assigned the role: ${signupResponse.data.role}`);
        setIsLogin(true);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h2>{isLogin ? "Log In" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">{isLogin ? "Log In" : "Sign Up"}</button>
        </form>
        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span style={styles.toggleText} onClick={toggleForm}>{isLogin ? "Sign Up" : "Log In"}</span>
        </p>
      </div>
      <div style={styles.rightPanel}>
        <h1>Welcome to ChatApp</h1>
        <p>{isLogin ? "Log in to continue chatting." : "Create an account to start chatting."}</p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#1e1e2f", color: "white" },
  leftPanel: { width: "40%", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  rightPanel: { width: "60%", backgroundColor: "#252542", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  toggleText: { color: "#4a90e2", cursor: "pointer" },
};

export default LoginSignup;
