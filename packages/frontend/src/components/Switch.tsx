import React from "react";

type Props = { checked: boolean; onChange: (v: boolean) => void };

export default function Switch({ checked, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full p-0.5 transition ${checked ? "bg-green-500" : "bg-gray-300"}`}
      type="button"
      aria-pressed={checked}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
