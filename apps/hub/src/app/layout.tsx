import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Monolith Hub - Lifestyle, Work & Game Ecosystem",
  description:
    "Centralized App Launcher and Portal with Seamless Single Sign-On and iOS LiquidGlass Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-zinc-100 min-h-screen relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
        <div className="relative z-10 flex flex-col min-h-screen">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {children}

          <footer className="launcher-footer mt-auto px-6 text-xs text-zinc-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-300">
                  Monolith Hub
                </span>
                <span>•</span>
                <span>All your spaces, together.</span>
              </div>
              <p>One account. Endless possibilities.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
