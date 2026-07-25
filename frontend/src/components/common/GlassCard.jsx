import React from "react";

const GlassCard = ({ children, className = "", onClick, ...props }) => {
  return (
    <div
      className={`glass-card p-4 md:p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-xl ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
