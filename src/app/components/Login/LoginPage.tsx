"use client";
import React, { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useTranslation } from "react-i18next";
import { AlertCircle, Lock, User } from "lucide-react";


const LoginPage = () => {
  const { t } = useTranslation();
  const { setIsAuthenticated, setRole, setUserData } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setSelectedClientId } = useClient();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4 overflow-hidden relative mt-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border-2 border-white/50">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-red-500 via-white to-blue-500 relative h-32 pt-6 pl-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              {t("signIn")}
            </h1>
            <p className="text-black/90 text-sm">Bienvenido de vuelta 👋</p>

            {/* Logo flotante */}
            <div className="absolute -bottom-10 left-8 bg-white rounded-2xl h-20 w-20 flex justify-center items-center shadow-xl border-4 border-white">
              <img
                src="/dma.png"
                alt="logo"
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col pt-16 px-8 pb-8 gap-6"
          >
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {/* Username field */}
            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-2"
                htmlFor="username"
              >
                👤 {t("username")}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  placeholder={t("enterUsername")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-2"
                htmlFor="password"
              >
                🔒 {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                  onClick={togglePasswordVisibility}
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showPassword ? (
                    <IoMdEyeOff size={20} />
                  ) : (
                    <IoMdEye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
              </label>
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-700 font-medium cursor-pointer"
              >
                {t("rememberMe")}
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 via-white to-blue-500 text-black py-4 px-4 rounded-2xl font-bold text-lg hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("loading") || "Cargando..."}
                </span>
              ) : (
                `🚀 ${t("signIn")}`
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pb-8 pt-4 text-center border-t-2 border-gray-100 mx-8">
            <a
              href="#"
              className="text-sm font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all"
            >
              🔑 {t("forgotPassword")}
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center mt-6 text-sm text-gray-600 font-medium">
          © 2025 DMA. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
