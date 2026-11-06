"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-6"
    >
      <h1 className="text-3xl font-bold">
        The arena is temporarily unavailable.
      </h1>
      <p className="text-zinc-400">Please try connecting again.</p>
      <button
        onClick={reset}
        className="self-start rounded-xl bg-cyan-600 px-5 py-3"
      >
        Reconnect
      </button>
    </main>
  );
}
