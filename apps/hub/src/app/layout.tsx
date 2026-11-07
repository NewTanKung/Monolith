import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Monolith — ทุกบริการในบัญชีเดียว",
  description: "รวมบริการและเครื่องมือของคุณ พร้อมบัญชีเดียวสำหรับทุกพื้นที่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className="bg-[#08090d] text-zinc-100 min-h-screen relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
        <div className="relative z-10 flex flex-col min-h-screen">
          <a href="#main-content" className="skip-link">
            ข้ามไปเนื้อหา
          </a>
          {children}

          <footer className="launcher-footer mt-auto px-6 text-xs text-zinc-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-300">
                  Monolith Hub
                </span>
                <span>•</span>
                <span>ทุกบริการ ในพื้นที่เดียว</span>
              </div>
              <p>เชื่อมทุกบริการด้วยบัญชีเดียว</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
