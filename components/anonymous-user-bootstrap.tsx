"use client";

import { initializeAnonymousUser } from "@/lib/anonymous-user";

let didEnsureAnonymousUser = false;

/** Ensures `anonymousUserId` exists in localStorage as early as the client bundle runs. */
export function AnonymousUserBootstrap() {
  if (typeof window !== "undefined" && !didEnsureAnonymousUser) {
    didEnsureAnonymousUser = true;
    initializeAnonymousUser();
  }
  return null;
}
