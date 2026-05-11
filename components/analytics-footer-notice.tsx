"use client";

/**
 * Shown only when PostHog is configured at build time.
 */
export function AnalyticsFooterNotice() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  return (
    <p className="text-center text-[10px] leading-snug text-zinc-400 px-3 py-1.5">
      Anonymous usage analytics enabled to improve the app.
    </p>
  );
}
