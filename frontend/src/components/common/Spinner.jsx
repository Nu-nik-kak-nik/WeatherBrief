import React from "react";

const Spinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Spinner;
