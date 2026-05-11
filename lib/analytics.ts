import posthog from "posthog-js";

import {
  getAnonymousUserId,
  initializeAnonymousUser,
} from "@/lib/anonymous-user";

const SESSION_APP_OPENED_KEY = "lt_analytics_app_opened";

export const ANALYTICS_EVENT_NAMES = [
  "app_opened",
  "habit_checked",
  "habit_unchecked",
  "calendar_opened",
  "date_changed",
  "habit_created",
  "habit_deleted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

let productAnalyticsInitialized = false;

function hasPublicPosthogKey(): boolean {
  return !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

/**
 * Initializes PostHog once, binds `anonymousUserId` as distinct id, fires `app_opened` at most once per browser session.
 * No-op when `NEXT_PUBLIC_POSTHOG_KEY` is unset (easy local / staging opt-out).
 */
export function initProductAnalytics(): void {
  if (typeof window === "undefined" || productAnalyticsInitialized) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  initializeAnonymousUser();
  const distinctId = getAnonymousUserId();
  if (!distinctId) return;

  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  posthog.init(apiKey, {
    api_host: apiHost,
    persistence: "localStorage",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    loaded: () => {},
  });

  posthog.identify(distinctId);
  productAnalyticsInitialized = true;

  try {
    if (!window.sessionStorage.getItem(SESSION_APP_OPENED_KEY)) {
      window.sessionStorage.setItem(SESSION_APP_OPENED_KEY, "1");
      posthog.capture("app_opened", {
        anonymousUserId: distinctId,
      });
    }
  } catch {
    /* sessionStorage blocked */
  }
}

type TrackOptions = {
  /** PostHog deduplication key (e.g. strict-mode double renders). */
  insertId?: string;
};

/**
 * Sends a single behavioral event. Prefer explicit properties only; `anonymousUserId` is attached automatically.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, unknown>,
  options?: TrackOptions
): void {
  if (typeof window === "undefined" || !hasPublicPosthogKey()) return;
  if (!productAnalyticsInitialized) return;

  const anonymousUserId = getAnonymousUserId();
  const payload: Record<string, unknown> = {
    ...(properties ?? {}),
    ...(anonymousUserId ? { anonymousUserId } : {}),
  };
  if (options?.insertId) {
    payload.$insert_id = options.insertId;
  }

  posthog.capture(eventName, payload);
}
