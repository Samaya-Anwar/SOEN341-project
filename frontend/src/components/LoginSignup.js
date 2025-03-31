import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "../api/post/signUpUser";
import { loginUser } from "../api/post/loginUser";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Handle login
        const response = await loginUser({
          username: loginData.username,
          password: loginData.password,
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);
        alert(`Login successful! Your role is ${response.data.role}`);
        navigate("/chat");
      } else {
        // Handle signup; role is defaulted on the backend to "member"
        console.log("Signup Data Before Sending:", loginData);
        const signupResponse = await signUpUser(loginData);
        alert(`Signup successful! Your role is ${signupResponse.data.role}`);
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
    const { credential } = response; // Google token
    try {
      console.log("Sending token to backend:", credential);
      const googleResponse = await axios.post(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/google-login`,
        { token: credential }
      );
      console.log("Backend response:", googleResponse.data);
      if (
        googleResponse.data.token &&
        googleResponse.data.username &&
        googleResponse.data.role
      ) {
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
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <a href="/">
          <img alt="ChatApp" src="./logo.png" className="mx-auto h-18 w-auto" />
        </a>
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          {isLogin ? "Log in to continue chatting." : "Create an account to start chatting."}
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-900">
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900"
              />
            </div>
          </div>
          {/* Google Login Button */}
          <div className="flex w-full justify-center">
            {isLogin && (
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
              />
            )}
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {isLogin ? "Log In" : "Sign Up"}
            </button>
            <p className="mt-10 text-center text-sm text-gray-500">
              {isLogin ? "Not a member?" : "Already a member?"}{" "}
              <a onClick={toggleForm} className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                {isLogin ? "Sign up" : "Log in"}
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;