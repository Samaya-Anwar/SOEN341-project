import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "../api/post/signUpUser";
import { loginUser } from "../api/post/loginUser";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

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
        alert(
          `Google Login successful! Your role is ${googleResponse.data.role}`
        );
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
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Theme Toggle */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? "hover:bg-gray-800 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <a href="/">
            <img
              alt="ChatApp"
              src="./logo.png"
              className="mx-auto h-12 w-auto sm:h-14 md:h-16 transition-all duration-200"
            />
          </a>
          <h2
            className={`mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold tracking-tight ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {isLogin ? "Log in to continue chatting" : "Create an account"}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="username"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  className={`block w-full rounded-lg px-3 py-2 text-sm sm:text-base border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className={`block w-full rounded-lg px-3 py-2 text-sm sm:text-base border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {/* Google Login */}
          {isLogin && (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
              />
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </div>

          {/* Toggle Login/Signup */}
          <p
            className={`text-sm text-center ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleForm}
              className={`font-medium ${
                isDarkMode
                  ? "text-indigo-400 hover:text-indigo-300"
                  : "text-indigo-600 hover:text-indigo-500"
              } transition-colors`}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;
