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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] p-4 overflow-hidden relative mt-8">
      {/* Glow sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[#E10600] opacity-10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-white opacity-5 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="relative p-12 border-b border-white/10">
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {t("signIn")}
              <span className="text-[#E10600]">.</span>
            </h1>
            <p className="text-white/70 text-sm">Bienvenido de vuelta 👋</p>

            {/* Logo */}
            <div className="absolute -bottom-10 left-8 bg-[#0B0B0B] rounded-2xl h-20 w-20 flex justify-center items-center shadow-xl border border-white/10">
              <img
                src="https://res.cloudinary.com/dw3folb8p/image/upload/v1771943697/ed_cimcok.png"
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
              <div className="bg-[#E10600]/10 border border-[#E10600]/30 text-white px-4 py-3 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#E10600]" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label
                className="block text-sm font-extrabold text-white/80 mb-2"
                htmlFor="username"
              >
                👤 {t("username")}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="username"
                  type="text"
                  placeholder={t("enterUsername")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="
                  w-full pl-12 pr-4 py-3
                  bg-[#0B0B0B]
                  border border-white/10
                  rounded-2xl
                  text-white
                  placeholder:text-white/40
                  focus:outline-none
                  focus:border-[#E10600]/60
                  focus:ring-2 focus:ring-[#E10600]/25
                  transition-all font-semibold
                "
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-extrabold text-white/80 mb-2"
                htmlFor="password"
              >
                🔒 {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                  w-full pl-12 pr-12 py-3
                  bg-[#0B0B0B]
                  border border-white/10
                  rounded-2xl
                  text-white
                  placeholder:text-white/40
                  focus:outline-none
                  focus:border-[#E10600]/60
                  focus:ring-2 focus:ring-[#E10600]/25
                  transition-all font-semibold
                "
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
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
                <div
                  className="
                w-11 h-6
                bg-white/15
                rounded-full
                peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#E10600]/25
                peer-checked:bg-[#E10600]
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-full
              "
                />
              </label>
              <label
                htmlFor="rememberMe"
                className="text-sm text-white/70 font-semibold cursor-pointer"
              >
                {t("rememberMe")}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
              w-full
              bg-[#E10600] text-white
              py-4 px-4
              rounded-2xl
              font-extrabold text-lg
              hover:bg-[#c80500]
              transition-all
              focus:outline-none focus:ring-2 focus:ring-[#E10600]/25
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl
              transform hover:scale-[1.02] active:scale-[0.98]
            "
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
          <div className="pb-8 pt-4 text-center border-t border-white/10 mx-8">
            <a
              href="#"
              className="text-sm font-extrabold text-white/70 hover:text-[#E10600] transition-all"
            >
              🔑 {t("forgotPassword")}
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center mt-6 text-sm text-white/50 font-semibold">
          © 2025 En Directo. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
