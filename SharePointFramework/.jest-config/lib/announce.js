/**
 * Status messages in component tests: what Fluent's `AriaLiveAnnouncer` has said (#1788). Usage,
 * in a solution's test:
 *
 *   import { announced } from 'pp365-jest-config/lib/announce'
 *
 *   await waitFor(() => expect(announced()).toContain(strings.Saved))
 *
 * The announcer writes each message as `innerText` on a span of its own in a live region it adds
 * to the body. jsdom keeps `innerText` as a property rather than as text, and ignores the
 * announcer clearing the region through `innerText` too, so every span stays: the newest message
 * is the last span. Read from the first, a second message read as the first. The announcer sends
 * a moment after `announce`, so wait for it.
 *
 * Only a tree under an `AriaLiveAnnouncer` announces: `renderReact` gives every root one, and a
 * test that renders with Testing Library wraps its tree in one.
 */

/**
 * The newest message in each live region on the page, joined by spaces.
 *
 * @returns {string}
 */
function announced() {
  return Array.from(document.body.querySelectorAll('[aria-live]'))
    .map((region) => {
      const spans = region.querySelectorAll('span')
      const span = spans[spans.length - 1]
      return (span && (span.innerText || span.textContent)) || region.textContent || ''
    })
    .join(' ')
}

module.exports = { announced }
