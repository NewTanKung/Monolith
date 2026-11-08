import type { Metadata } from "next";
import "../styles/globals.css";
import localFont from "next/font/local";
import { Providers } from "@/components/common/Providers";
import { themeBootstrap } from "@/lib/theme-bootstrap";

const sarabun = localFont({
  src: [
    {
      path: "../styles/fonts/Sarabun-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../styles/fonts/Sarabun-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../styles/fonts/Sarabun-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-sarabun",
  display: "swap",
});

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
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={sarabun.variable}>
        <Providers>
          <div className="relative z-10 flex flex-col min-h-screen">
            <a href="#main-content" className="skip-link">
              ข้ามไปเนื้อหา
            </a>
            {children}

            <footer className="launcher-footer mt-auto">
              <span translate="no">Monolith</span>
              <span aria-hidden="true">·</span>
              <span>ทุกบริการ ในพื้นที่เดียว</span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
