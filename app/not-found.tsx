import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 text-center lg:px-[15px]">
      <h1>Page not found</h1>
      <p className="mt-4">The page you are looking for doesn&rsquo;t exist or is no longer available.</p>
      <Link
        href="/store"
        className="mt-8 inline-block bg-surface px-[10px] py-[5px] transition-colors duration-300 hover:bg-foreground hover:text-background"
      >
        Back to the store
      </Link>
    </div>
  );
}
