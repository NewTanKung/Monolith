import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Monolith Hub - Lifestyle, Work & Game Ecosystem",
  description: "Centralized App Launcher and Portal with Seamless Single Sign-On and iOS LiquidGlass Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-zinc-100 min-h-screen relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
        {/* Ambient Liquid Glow Orbs */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />
        <div className="fixed top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-cyan-600/8 blur-[160px] pointer-events-none -z-10" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}

          <footer className="mt-auto py-8 px-4 text-center border-t border-white/5 text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-300">Monolith Hub</span>
                <span>•</span>
                <span>iOS LiquidGlass Platform</span>
              </div>
              <p>Integrated Single Sign-On & Ecosystem App Launcher</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
