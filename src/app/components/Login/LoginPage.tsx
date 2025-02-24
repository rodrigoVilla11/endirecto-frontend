"use client";
import React, { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const { setIsAuthenticated, setRole, setUserData } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setSelectedClientId } = useClient();

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
          headers: { "Content-Type": "application/json" },
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
        branch: data.branch,
        seller_id: data.seller_id,
        notifications: data.notifications
      };

      if (userData._id.length < 10) {
        setSelectedClientId(userData._id);
      }

      localStorage.setItem("token", data.access_token);
      setUserData(userData);
      setIsAuthenticated(true);
      setRole(data.role);
      router.push("/dashboard");
    } catch (err) {
      setError(t("invalidCredentials"));
      alert(t("invalidCredentials"));
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-100 p-4 overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg space-y-6">
        <div className="bg-primary-subtle relative h-24 pt-4 pl-6 rounded-t-md">
          <h1 className="text-2xl font-semibold text-gray-800">{t("signIn")}</h1>
          <div className="absolute -bottom-4 left-6 bg-primary rounded-full h-16 w-16 flex justify-center items-center p-1 shadow-md">
            <img
              src="/dma.png"
              alt="logo-navbar"
              className="w-3/4 h-3/4 object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col pt-14 px-6 gap-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="username"
            >
              {t("username")}
            </label>
            <input
              id="username"
              type="text"
              placeholder={t("enterUsername")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="relative">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="password"
            >
              {t("password")}
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <IoMdEyeOff size={18} /> : <IoMdEye size={18} />}
            </button>
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary mt-1"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600 leading-tight">
              {t("rememberMe")}
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 px-4 rounded-md font-medium hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t("signIn")}
          </button>
        </form>

        <div className="pb-6 pt-4 text-center border-t border-gray-100 mx-6">
          <a
            href="#"
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            {t("forgotPassword")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
