export default function Loading() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="กำลังโหลดพื้นที่บริการ"
      className="mx-auto max-w-7xl space-y-8 px-5 py-12"
    >
      <p role="status" className="text-zinc-400">
        กำลังโหลดพื้นที่บริการ…
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </main>
  );
}
