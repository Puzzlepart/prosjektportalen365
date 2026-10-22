/**
 * Types for `pp365-jest-config/lib/announce`, so the solutions' tests compile without a
 * declaration of their own.
 */

/**
 * The newest message in each live region on the page, joined by spaces: what Fluent's
 * `AriaLiveAnnouncer` has said last. The announcer sends a moment after `announce`, so read it in
 * `waitFor`.
 */
export declare function announced(): string
