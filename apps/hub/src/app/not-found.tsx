import Link from "next/link";
import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
export default function NotFound() {
  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" className="empty-screen">
        <p className="text-accent text-sm">404</p>
        <h1>ไม่พบพื้นที่ที่ต้องการ</h1>
        <p>ลิงก์นี้อาจเปลี่ยนไป หรือบริการยังไม่เปิดให้บัญชีของคุณเข้าใช้</p>
        <Link href="/" className="primary-button">
          กลับหน้า Hub
        </Link>
      </main>
    </>
  );
}
