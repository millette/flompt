/// <reference types="vite/client" />
/**
 * analytics.ts — PostHog wrapper
 *
 * Design principles for zero-lag:
 * - Init is deferred (called after first render, never blocks)
 * - autocapture OFF → only explicit events, no DOM scanning overhead
 * - All calls are try/caught → PostHog failures never break the app
 * - No tracking in dev (opt_out_capturing)
 */

import posthog from 'posthog-js'

const KEY  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

let ready = false

export const initAnalytics = () => {
  if (!KEY || ready) return
  ready = true

  posthog.init(KEY, {
    api_host:                 HOST,
    capture_pageview:         true,
    capture_pageleave:        true,
    autocapture:               false,  // manual only — no DOM polling
    disable_session_recording: true,  // opt-in later if needed
    request_batching:          true,  // batch network requests
    loaded: (ph) => {
      // No tracking in local dev
      if ((import.meta.env.DEV as boolean)) ph.opt_out_capturing()
    },
  })
}

/** Fire-and-forget event — never throws */
export const track = (event: string, props?: Record<string, unknown>) => {
  try { posthog.capture(event, props) } catch { /* silent */ }
}

// ── Typed event helpers ───────────────────────────────────────────────────────

export const analytics = {
  // Tour
  tourStarted:    ()                                  => track('tour_started'),
  tourStep:       (step: number, title: string)       => track('tour_step',       { step, title }),
  tourCompleted:  ()                                  => track('tour_completed'),
  tourSkipped:    (atStep: number)                    => track('tour_skipped',    { at_step: atStep }),

  // Core actions
  decomposeClicked:   ()                              => track('decompose_clicked'),
  decomposeCompleted: (blockCount: number)            => track('decompose_completed', { block_count: blockCount }),
  compileClicked:     ()                              => track('compile_clicked'),
  compileCompleted:   (tokenEstimate: number)         => track('compile_completed',   { token_estimate: tokenEstimate }),
  promptCopied:       ()                              => track('prompt_copied'),
  promptExported:     (format: 'txt' | 'json')        => track('prompt_exported',     { format }),

  // Blocks
  blockAdded:   (type: string)                        => track('block_added',     { type }),
  blockDeleted: (type: string)                        => track('block_deleted',   { type }),

  // Settings
  localeChanged: (locale: string)                     => track('locale_changed',  { locale }),

  // Errors
  error: (context: string, message?: string)          => track('error', { context, message }),
}
