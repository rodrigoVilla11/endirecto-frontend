'use client'
import React, { useState } from "react";
import { IoMdLock, IoMdEye, IoMdEyeOff } from "react-icons/io";
import Image from "next/image";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white h-128 w-112 shadow-2xl rounded-md">
        <div className="bg-primary-subtle h-20 pt-4 pl-6 rounded-t-md">
          <p className="text-xl font-bold text-gray-700">Sign In</p>
          <div className="bg-primary rounded-full h-16 w-16 mt-2 flex justify-center items-center p-1">
            <Image src="dma.png" alt="logo-navbar" />
          </div>
        </div>

        <form action="" className="flex flex-col p-10 gap-3">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              User / Client Code
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="User / Client Code"
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
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
            </button>
          </div>
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="collaboratorUser"
            >
              Collaborator User (Optional)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="collaboratorUser"
              type="text"
              placeholder="Collaborator User (Optional)"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-xs text-gray-700">
              Remember Me
            </label>
          </div>
          <div className="mt-4">
            <button className="w-full h-10 rounded-sm bg-primary text-white text-sm font-bold">
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
