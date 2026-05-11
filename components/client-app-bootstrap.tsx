"use client";

import { initProductAnalytics } from "@/lib/analytics";
import { initializeAnonymousUser } from "@/lib/anonymous-user";

let clientAppBootstrapRan = false;

/**
 * Ensures anonymous user id, then initializes minimal PostHog (when configured).
 */
export function ClientAppBootstrap() {
  if (typeof window === "undefined" || clientAppBootstrapRan) {
    return null;
  }
  clientAppBootstrapRan = true;

  initializeAnonymousUser();
  initProductAnalytics();

  return null;
}
