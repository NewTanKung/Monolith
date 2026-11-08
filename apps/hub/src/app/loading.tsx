import { WorkspaceHeader } from "@/components/common/WorkspaceHeader";
export default function Loading() {
  return (
    <>
      <WorkspaceHeader />
      <main
        id="main-content"
        aria-busy="true"
        aria-label="กำลังโหลดพื้นที่บริการ"
        className="mx-auto w-full max-w-5xl px-5 py-16"
      >
        <p role="status" className="text-muted text-center">
          กำลังโหลดพื้นที่บริการ…
        </p>
        <div className="skeleton h-12 mx-auto mt-6 max-w-xl" />
        <div
          className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-6 mt-12"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="skeleton w-12 h-12" />
              <div className="skeleton w-20 h-3" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
