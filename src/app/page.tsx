"use client"
import HomePage from "./components/Home/HomePage";
import "./i18n/i18n"; // Esto ejecuta la configuración de i18n

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between">
     <HomePage />
    </main>
  );
}
