"use client";
import React, { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { IoPersonOutline } from "react-icons/io5";
import { FaPowerOff } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useClient } from "@/app/context/ClientContext";
import { useGetCustomerByIdQuery } from "@/redux/services/customersApi";
import { SlLogout } from "react-icons/sl";

const Profile = () => {
  const { selectedClientId, setSelectedClientId } = useClient();
  const { data, error, isLoading, refetch } = useGetCustomerByIdQuery({
    id: selectedClientId || "",
  });

  const { setIsAuthenticated, setRole, userData } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRedirect = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsMenuOpen(!isMenuOpen);
    router.push("/login");
    setIsAuthenticated(false);
    setRole(null);
  };

  const getInitial = () => {
    if (selectedClientId && data?.name) {
      return data.name.charAt(0);
    } else if (userData?.username) {
      return userData.username.charAt(0);
    }
    return ""; 
  };

  const handleDeselectCustomer = () => {
    setSelectedClientId("")
    setIsMenuOpen(!isMenuOpen);

  }

  return (
    <div className="relative">
      <button
        className="flex justify-center items-center gap-1"
        onClick={toggleMenu}
      >
        <div className="rounded-full h-10 w-10 bg-white flex justify-center items-center">
          <p>{getInitial()}</p>
        </div>
        <div className="flex justify-center items-center text-white">
          <p>{selectedClientId ? data?.name : userData?.username}</p>
          <IoIosArrowDown />
        </div>
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
          <ul>
            <li
              onClick={() => handleRedirect("/profile/my-profile")}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-1"
            >
              <IoPersonOutline /> My Profile
            </li>
            {selectedClientId && (
              <>
                <hr />
                <li
                  onClick={handleDeselectCustomer}
                  className="px-2 py-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-1 text-red-600"
                >
                  <SlLogout /> Deselect Customer
                </li>
              </>
            )}
            <hr />
            <li
              onClick={handleLogout}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-1 text-red-600"
            >
              <FaPowerOff /> Log Out
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Profile;
