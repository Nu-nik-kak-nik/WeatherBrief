import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { FiLogOut, FiUser } from "react-icons/fi";

const AuthStatus = () => {
  const { user, logout } = useAuth();
  const { profile } = useUser();

  if (user && profile) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#fabd2f] flex items-center justify-center text-sm font-bold text-[#1d2021]">
            {profile.username?.[0]?.toUpperCase() || <FiUser size={16} />}
          </div>
          <span className="hidden sm:inline text-[#ebdbb2]">
            {profile.username}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-red-500/20 transition text-[#ebdbb2]"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <Link
      to="/login"
      className="bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] text-sm py-2 px-4 rounded-full transition"
    >
      Войти
    </Link>
  );
};

export default AuthStatus;
