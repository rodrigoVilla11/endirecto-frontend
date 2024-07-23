'use client'
import React, { useState } from "react";
import { IoMdLock, IoMdEye, IoMdEyeOff } from "react-icons/io";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white h-112 w-112 shadow-2xl rounded-md">
        <div className="bg-primary-subtle h-20 pt-4 pl-6 rounded-t-md">
          <p className="text-xl font-bold text-gray-700">Reset Password</p>
          <div className="bg-primary rounded-full h-16 w-16 mt-2 flex justify-center items-center p-1">
            <img src="dma.png" alt="logo-navbar" />
          </div>
        </div>
        <div className="border border-success rounded-md mx-10 mt-16 p-4 text-center text-sm bg-success-subtle">
            <p>Enter your client code and instructions will be sent to you!</p>
        </div>
        <form action="" className="flex flex-col px-10 mt-6 gap-3">
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
             Client Code
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Client Code"
            />
          </div>      
          <div className="mt-4">
            <button className="w-full h-10 rounded-sm bg-primary text-white text-sm font-bold">
              Reset
            </button>
          </div>
        </form>
        <button className="flex mt-6 items-center justify-center w-full pb-4 text-xs text-primary-subtle">
          <p>Remember it? Sign In Here</p>
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
