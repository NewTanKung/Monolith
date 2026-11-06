"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center gap-5 px-6"
    >
      <p className="text-xs uppercase tracking-widest text-indigo-300">
        Monolith Hub
      </p>
      <h1 className="text-3xl font-bold">We could not load your workspace.</h1>
      <p className="text-zinc-400">Please try again in a moment.</p>
      <button
        onClick={reset}
        className="self-start rounded-xl bg-indigo-600 px-5 py-3 font-semibold"
      >
        Try again
      </button>
    </main>
  );
}
