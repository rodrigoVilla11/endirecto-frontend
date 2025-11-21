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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md
        ${
          active
            ? "bg-gradient-to-r from-red-500 via-white to-blue-500 text-black"
            : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
        }`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-full transition-all duration-300
            ${active ? "bg-white shadow-lg" : "bg-gray-300"}`}
        />
        {active && (
          <div className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-red-500 via-white to-blue-500" />
        )}
      </div>
      <span className={`text-sm font-semibold ${active ? "text-black" : "text-gray-700"}`}>
        {title}
      </span>
    </button>
  );
}

export default ButtonOnOff;