"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdLock, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useAuth } from "@/app/context/AuthContext";

const LoginPage = () => {
  const { setIsAuthenticated, setRole, setUserData } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000"
        }/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      const userData = {
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role,
        branch: data.branch
      };

      localStorage.setItem("token", data.access_token);
      setUserData(userData)
      setIsAuthenticated(true);
      setRole(data.role); 
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid username or password");
      alert("Invalid username or password");
    }
  };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white h-128 w-112 shadow-2xl rounded-md">
        <div className="bg-primary-subtle h-20 pt-4 pl-6 rounded-t-md">
          <p className="text-xl font-bold text-gray-700">Sign In</p>
          <div className="bg-primary rounded-full h-16 w-16 mt-2 flex justify-center items-center p-1">
            <img src="/dma.png" alt="logo-navbar" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col p-10 gap-3">
          {error && <p className="text-red-500">{error}</p>}{" "}
          {/* Muestra el error */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="rememberMe" className="mr-2" />
            <label htmlFor="rememberMe" className="text-xs text-gray-700">
              Remember Me
            </label>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="w-full h-10 rounded-sm bg-primary text-white text-sm font-bold"
            >
              Sign In
            </button>
          </div>
        </form>

        <button className="flex gap-1 items-center justify-center w-full pb-4 text-xs text-primary-subtle">
          <IoMdLock />
          <p>Forgot Your Password?</p>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
