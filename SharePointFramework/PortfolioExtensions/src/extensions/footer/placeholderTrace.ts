import { ApplicationCustomizerContext, PlaceholderName } from '@microsoft/sp-application-base'
import { ISPEventObserver } from '@microsoft/sp-core-library'

/**
 * Turns the footer's placeholder trace on: `'1'` under this key in `sessionStorage` or
 * `localStorage`. The browser suite's diagnostics set it in sessionStorage; set by hand in
 * DevTools, localStorage reaches every new tab as well.
 */
export const PLACEHOLDER_TRACE_KEY = 'pp365.debug.placeholders'

/** Starts every line of the trace, which is how the diagnostics find them in the console. */
export const PLACEHOLDER_TRACE_PREFIX = '[pp365 placeholders]'

/** Writes one step of the trace, with what the step found. */
export type PlaceholderTrace = (step: string, details?: Record<string, unknown>) => void

/** Whether the trace is on. A storage the browser refuses counts as off. */
function isTraceOn(): boolean {
  for (const storage of ['sessionStorage', 'localStorage'] as const) {
    try {
      if (window[storage].getItem(PLACEHOLDER_TRACE_KEY) === '1') return true
    } catch {
      // Blocked storage (strict privacy settings, a sandboxed frame) leaves the trace off.
    }
  }
  return false
}

/** The placeholders SharePoint offers now, by their names in `PlaceholderName`. */
function placeholderNames(context: ApplicationCustomizerContext): string[] {
  const names = PlaceholderName as unknown as Record<string, unknown>
  return context.placeholderProvider.placeholderNames.map(
    (value) => Object.keys(names).find((name) => names[name] === value) ?? String(value)
  )
}

/**
 * Logs placeholder availability and navigation timing for SharePoint/sp-dev-docs#11070.
 * Subscribes only when tracing is enabled; otherwise returns a no-op writer.
 *
 * @param observer The customizer, which SPFx's events take as the observer of a handler
 */
export function tracePlaceholders(
  observer: ISPEventObserver,
  context: ApplicationCustomizerContext
): PlaceholderTrace {
  if (!isTraceOn()) return () => undefined
  const trace: PlaceholderTrace = (step, details = {}) => {
    const line = {
      step,
      ms: Math.round(performance.now()),
      placeholderNames: placeholderNames(context),
      bottomElement: !!document.querySelector(
        '[data-sp-placeholder="Bottom"], #spBottomPlaceholder'
      ),
      ...details
    }
    // eslint-disable-next-line no-console -- the trace is meant for the console
    console.info(PLACEHOLDER_TRACE_PREFIX, JSON.stringify(line))
  }
  trace('onInit')
  // SPFx keeps a list of handlers per event, so these sit beside the footer's own.
  context.placeholderProvider.changedEvent.add(observer, () => trace('changedEvent'))
  context.application.navigatedEvent.add(observer, () => trace('navigatedEvent'))
  return trace
}
