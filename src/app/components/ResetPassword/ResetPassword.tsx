"use client";
import React, { useState } from "react";
import { IoMdLock, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";

const LoginPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setSelectedClientId } = useClient();
  const { setIsAuthenticated, setRole, setUserData } = useAuth();

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
        notifications: data.notifications,
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
    <div className="min-h-screen flex items-start justify-center bg-[#0B0B0B] p-4 overflow-hidden">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-24 pt-4 pl-6 bg-white/5 border-b border-white/10">
          <h1 className="text-2xl font-extrabold text-white">
            {t("signIn")}
            <span className="text-[#E10600]">.</span>
          </h1>

          <div className="absolute -bottom-6 left-6 bg-[#0B0B0B] border border-white/10 rounded-2xl h-16 w-16 flex justify-center items-center p-2 shadow-2xl">
            <img
              src="/dma.png"
              alt={t("logoAltText")}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Acento marca */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E10600] opacity-90" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col pt-14 px-6 gap-4 pb-6"
        >
          {error && (
            <div className="bg-[#E10600]/15 text-[#E10600] px-4 py-2 rounded-xl text-sm border border-[#E10600]/30">
              {error}
            </div>
          )}

          <div>
            <label
              className="block text-sm font-semibold text-white/80 mb-2"
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
              className="
              w-full px-3 py-2 rounded-xl
              bg-white/10 text-white
              border border-white/20
              placeholder:text-white/40
              outline-none transition-all
              focus:border-[#E10600]
              focus:ring-1 focus:ring-[#E10600]/40
            "
            />
          </div>

          <div className="relative">
            <label
              className="block text-sm font-semibold text-white/80 mb-2"
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
              className="
              w-full px-3 py-2 pr-10 rounded-xl
              bg-white/10 text-white
              border border-white/20
              placeholder:text-white/40
              outline-none transition-all
              focus:border-[#E10600]
              focus:ring-1 focus:ring-[#E10600]/40
            "
            />

            <button
              type="button"
              className="
              absolute right-3 top-[38px]
              text-white/60 hover:text-white
              transition-colors
            "
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
              className="
              h-4 w-4 mt-1 rounded
              border-white/20 bg-white/10
              accent-[#E10600]
            "
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-white/60 leading-tight"
            >
              {t("rememberMe")}
            </label>
          </div>

          <button
            type="submit"
            className="
            w-full py-2.5 px-4 rounded-xl
            font-extrabold text-white
            bg-[#E10600]
            hover:opacity-90
            transition-all
            shadow-lg
            focus:outline-none
            focus:ring-2 focus:ring-[#E10600]/40
          "
          >
            {t("signIn")}
          </button>
        </form>

        {/* Footer */}
        <div className="pb-6 pt-4 text-center border-t border-white/10 mx-6">
          <a
            href="#"
            className="text-sm text-white/70 hover:text-[#E10600] font-semibold transition-colors"
          >
            {t("forgotPassword")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
