"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" className="empty-screen">
        <h1>โหลดพื้นที่บริการไม่สำเร็จ</h1>
        <p>ลองโหลดอีกครั้ง หากยังเข้าใช้ไม่ได้ ให้ติดต่อผู้ดูแลระบบ</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="primary-button" onClick={reset}>
            <RefreshCw size={17} />
            ลองใหม่
          </button>
          <Link className="secondary-button" href="/">
            กลับหน้า Hub
          </Link>
        </div>
      </main>
    </>
  );
}
