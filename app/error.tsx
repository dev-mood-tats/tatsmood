"use client";

// Si algo falla al cargar una página (normalmente, WordPress no responde).
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center lg:px-[15px]">
      <p>Something went wrong</p>
      <p className="mt-4">This page could not be loaded. Please try again in a moment.</p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-6 overflow-x-auto whitespace-pre-wrap bg-surface p-4 text-left">{message}</pre>
      )}
      <button type="button" onClick={() => retry()} className="mt-8 transition-opacity duration-300 hover:opacity-60">
        Try again
      </button>
    </div>
  );
}
