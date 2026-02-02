import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  icon?: React.ReactNode;
};

export default function StyledButton({ variant = "outline", icon, className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition shadow-sm";
  const styles =
    variant === "solid"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
