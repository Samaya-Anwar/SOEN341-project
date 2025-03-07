import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from '@react-oauth/google';
//import { GoogleLogin } from 'react-google-login';

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
  
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);
  
        alert(`Login successful! Your role is ${response.data.role}`);
        navigate("/chat");
      } else {
        // Handle signup
        const signupResponse = await axios.post("http://localhost:5001/api/signup", {
          username,
          password,
          email: username,  // assuming username is the email
          name: username,   // set name accordingly
        });
  
        alert(`Signup successful! You have been assigned the role: ${signupResponse.data.role}`);
        setIsLogin(true);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };
  
  // **Added handleGoogleLoginFailure for error handling**
  const handleGoogleLoginFailure = (error) => {
    console.error('Google Login Failed!', error);
  };

  const handleGoogleLoginSuccess = async (response) => {
    const { credential } = response;  // This should be the Google token
  
    try {
      console.log('Sending token to backend:', credential); // Log token before sending to backend
  
      // Send Google token to backend for verification
      const googleResponse = await axios.post("http://localhost:5001/api/google-login", { token: credential });
      console.log('Backend response:', googleResponse.data); // Log the backend response
  
      // Check if the response contains the expected fields
      if (googleResponse.data.token && googleResponse.data.username && googleResponse.data.role) {
        // Store token, username, and role in localStorage
        localStorage.setItem("token", googleResponse.data.token);
        localStorage.setItem("username", googleResponse.data.username);
        localStorage.setItem("role", googleResponse.data.role);
  
        console.log("Google login stored role:", googleResponse.data.role); // Debugging
        alert(`Google Login successful! Your role is ${googleResponse.data.role}`);
  
        navigate('/chat'); // Redirect to chat
      } else {
        alert('Unexpected response from server. Please try again.');
      }
    } catch (error) {
      console.error('Google Login Verification Failed:', error);
      alert('Google login failed. Please try again.');
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

        {/* **Added GoogleLogin button for Google login** */}
        {isLogin && (
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess} // On success, call handleGoogleLoginSuccess
            onError={handleGoogleLoginFailure}   // On failure, call handleGoogleLoginFailure
          />
        )}
        
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