import { Suspense } from "react";

import HomeClient from "./home-client";

function HomeFallback() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-5">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="h-20 rounded-2xl bg-zinc-100/80 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-zinc-100/80 animate-pulse" />
          <div className="h-24 rounded-2xl bg-zinc-100/80 animate-pulse" />
        </div>
        <div className="h-40 rounded-2xl bg-zinc-100/80 animate-pulse" />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeClient />
    </Suspense>
  );
}
