import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "../api/post/signUpUser";
import { loginUser } from "../api/post/loginUser";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "../context/ThemeContext";
import {
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
    isAdmin: false,
  });
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const showAlert = (message, type = "success", isAdmin = false) => {
    setAlert({ show: true, message, type, isAdmin });
    if (!isAdmin) {
      setTimeout(() => {
        setAlert({ show: false, message: "", type: "success", isAdmin: false });
      }, 5000);
    }
  };

  const closeAlert = () => {
    setAlert({ show: false, message: "", type: "success", isAdmin: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await loginUser({
          username: loginData.username,
          password: loginData.password,
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);

        showAlert(
          `Welcome back ${loginData.username}!`,
          "success",
          response.data.role === "admin"
        );
        if (response.data.role !== "admin") {
          setTimeout(() => {
            navigate("/chat");
          }, 1500);
        }
      } else {
        console.log("Signup Data Before Sending:", loginData);
        const signupResponse = await signUpUser(loginData);
        showAlert(
          `Signup successful! Your role is ${signupResponse.data.role}`
        );
        setIsLogin(true);
      }
    } catch (error) {
      showAlert("Something went wrong", "error");
    }
  };

  const handleGoogleLoginFailure = (error) => {
    console.error("Google Login Failed!", error);
    showAlert("Google login failed", "error");
  };

  const handleGoogleLoginSuccess = async (response) => {
    const { credential } = response;
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
        showAlert(
          `Google Login successful! Your role is ${googleResponse.data.role}`,
          "success",
          googleResponse.data.role === "admin"
        );

        if (googleResponse.data.role !== "admin") {
          setTimeout(() => {
            navigate("/chat");
          }, 1500);
        }
      } else {
        showAlert(
          "Unexpected response from server. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Google Login Verification Failed:", error);
      showAlert("Google login failed. Please try again.", "error");
    }
  };

  const navigateToAdmin = () => {
    navigate("/admin");
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      {alert.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center max-w-md transition-all duration-300 ${
            alert.type === "success"
              ? isDarkMode
                ? "bg-green-800 text-green-100"
                : "bg-green-100 text-green-800"
              : isDarkMode
              ? "bg-red-800 text-red-100"
              : "bg-red-100 text-red-800"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
          ) : (
            <ExclamationCircleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.message}</p>
            {alert.isAdmin && (
              <div className="mt-2 flex items-center">
                <button
                  onClick={navigateToAdmin}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    isDarkMode
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  } transition-colors`}
                >
                  Go to Admin Dashboard
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className={`ml-2 px-3 py-1 text-xs font-medium rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } transition-colors`}
                >
                  Go to Chat
                </button>
              </div>
            )}
          </div>
          <button
            onClick={closeAlert}
            className={`ml-2 p-1 rounded-full ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            } transition-colors`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

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

          {isLogin && (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </div>

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
