"use client";

interface ButtonOnOffProps {
  title: string;
  active?: boolean;
  onChange?: () => void;
}

export function ButtonOnOff({
  title,
  active = false,
  onChange,
}: ButtonOnOffProps) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors
        ${
          active
            ? "bg-red-500/20 text-red-400"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        }`}
    >
      <div
        className={`w-4 h-4 rounded-full transition-colors
          ${active ? "bg-red-500" : "bg-zinc-600"}`}
      />
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
}
export default ButtonOnOff;
