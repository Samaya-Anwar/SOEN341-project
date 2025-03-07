import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion"; // Import Framer Motion

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("LoginSignup component mounted!");
  }, []);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await axios.post("http://localhost:5001/api/login", { username, password });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);
        alert(`Login successful! Your role is ${response.data.role}`);
        navigate("/chat");
      } else {
        const signupResponse = await axios.post("http://localhost:5001/api/signup", {
          username,
          password,
          email: username,
          name: username,
        });
        alert(`Signup successful! You have been assigned the role: ${signupResponse.data.role}`);
        setIsLogin(true);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  const handleGoogleLoginFailure = (error) => {
    console.error("Google Login Failed!", error);
  };

  const handleGoogleLoginSuccess = async (response) => {
    const { credential } = response;
    try {
      console.log("Sending token to backend:", credential);
      const googleResponse = await axios.post("http://localhost:5001/api/google-login", { token: credential });

      if (googleResponse.data.token && googleResponse.data.username && googleResponse.data.role) {
        localStorage.setItem("token", googleResponse.data.token);
        localStorage.setItem("username", googleResponse.data.username);
        localStorage.setItem("role", googleResponse.data.role);
        alert(`Google Login successful! Your role is ${googleResponse.data.role}`);
        navigate("/chat");
      } else {
        alert("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.error("Google Login Verification Failed:", error);
      alert("Google login failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={styles.container}
    >
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={styles.leftPanel}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLogin ? "Log In" : "Sign Up"}
        </motion.h2>

        <motion.form
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
        >
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </motion.button>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span style={styles.toggleText} onClick={toggleForm}>{isLogin ? "Sign Up" : "Log In"}</span>
        </motion.p>

        {isLogin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={handleGoogleLoginFailure} />
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={styles.rightPanel}
      >
        {/* Logo at the top */}
        <img src="/logo1a.png" alt="ChatApp Logo" style={styles.logo} />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Welcome to ChatApp
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {isLogin ? "Log in to continue chatting." : "Create an account to start chatting."}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

const styles = {
  container: { 
    display: "flex", 
    height: "100vh", 
    background: "#2C3E50", // Keep the general background color
    color: "white" 
  },
  leftPanel: { 
    width: "40%", 
    padding: "20px", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center",
    background: "rgb(30, 45, 60)", // Darker version for contrast
  },
  rightPanel: { 
    width: "60%", 
    background: "rgb(44, 62, 80)", // Original color
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center",
    textAlign: "center"
  },
  logo: {
    width: "200px", // Increased size
    height: "auto",
    marginBottom: "15px",
    display: "block",
    objectFit: "contain",
  },
  toggleText: { color: "#4a90e2", cursor: "pointer" },
};


export default LoginSignup;
