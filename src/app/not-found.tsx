import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="station-label text-primary">404 · NO STATION</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">Page not found · 페이지를 찾을 수 없어요</h1>
      <Link href="/" className="mt-4 inline-block font-bold text-primary underline">
        Boundless ›
      </Link>
    </main>
  );
}
