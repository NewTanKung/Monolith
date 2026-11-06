import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Cyber Arena - Sub-App Demo",
  description: "Connected Sub-App demonstrating Monolith Single Sign-On",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070e] text-zinc-100 min-h-screen relative overflow-x-hidden">
        {/* Neon Ambient Orbs */}
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none -z-10" />
        {children}
      </body>
    </html>
  );
}
