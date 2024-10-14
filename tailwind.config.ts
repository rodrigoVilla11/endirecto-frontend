import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "body-color": "#495057",
        "header-color": "#2e2e2e",
        primary: "#2e2e2e",
        "primary-subtle": "rgba(46, 46, 46, .25)",
        secondary: "#74788d",
        table: "#6d6d6d",
        profile: "rgba(52, 58, 64, 0.25)",
        success: "#34c38f",
        "success-subtle": "rgba(52, 195, 143, .25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      spacing: {
        "112": "28rem",
        "116": "29rem",
        "128": "32rem",
        "90": "22.5rem",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        ".no-scrollbar": {
          "scrollbar-width": "none", // Firefox
          "-ms-overflow-style": "none", // Internet Explorer 10+
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Opera
        },
      });
    },
  ],
};
export default config;
