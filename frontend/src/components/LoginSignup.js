import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "../api/post/signUpUser";
import { loginUser } from "../api/post/loginUser";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    role: "member",
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

        // Store token, username, and role in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);

        console.log("Stored role in localStorage:", response.data.role); // Debugging
        alert(`Login successful! Your role is ${response.data.role}`);
        navigate("/chat"); // Redirect to chat
      } else {
        console.log("Signup Data Before Sending:", loginData);
        // Handle signup
        const signupResponse = await signUpUser(loginData);

        alert(
          `Signup successful! You have been assigned the role: ${signupResponse.data.role}`
        );
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
      console.log("Sending token to backend:", credential); // Log token before sending to backend

      const googleResponse = await axios.post(
        "http://localhost:5001/api/google-login",
        { token: credential }
      );
      console.log("Backend response:", googleResponse.data); // Log the backend response

      // Store the token, username, and role
      if (
        googleResponse.data.token &&
        googleResponse.data.username &&
        googleResponse.data.role
      ) {
        localStorage.setItem("token", googleResponse.data.token);
        localStorage.setItem("username", googleResponse.data.username);
        localStorage.setItem("role", googleResponse.data.role); // Store role
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
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <a href="/">
          <img alt="ChatApp" src="./logo.png" className="mx-auto h-18 w-auto" />
        </a>

        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          {isLogin
            ? "Log in to continue chatting."
            : "Create an account to start chatting."}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm/6 font-medium text-gray-900"
            >
              Username
            </label>
            <div className="mt-2">
              <input
                id="username"
                name="username"
                type="username"
                required
                autoComplete="email"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Password
              </label>
              <div className="text-sm">
                <a
                  href="/"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                autoComplete="current-password"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>
          {/* Show Role Selection Only in Signup Mode */}
          {!isLogin && (
            <div>
              <label
                htmlFor="Role"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Role
              </label>
              <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                <select
                  value={loginData.role}
                  onChange={(e) => {
                    console.log("Role Selected:", e.target.value);
                    setLoginData({ ...loginData, role: e.target.value });
                  }}
                  required
                  className="col-start-1 row-start-1 w-full appearance-none rounded-md px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-2 focus:-outline-offset-2  focus:outline-indigo-600 sm:text-sm/6"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
            </div>
          )}
          <button className="flex w-full justify-center rounded-md  px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs   ">
            {/* **Added GoogleLogin button for Google login** */}
            {isLogin && (
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
              />
            )}
          </button>
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {isLogin ? "Log In" : "Sign Up"}
            </button>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              {isLogin ? "Not a member ?" : "Already a member?"}{" "}
              <div className="text-indigo-600 ">
                <button
                  type="button"
                  className="sm:mx-auto sm:w-full sm:max-w-sm text-indigo-600 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
                  onClick={toggleForm}
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </div>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;
