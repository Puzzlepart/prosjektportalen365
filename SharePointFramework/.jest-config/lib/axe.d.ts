/**
 * Types for `pp365-jest-config/lib/axe`, so the solutions' tests compile without a dependency of
 * their own on jest-axe or axe-core. The results are typed as far as tests read them.
 */

/** One rule broken, with the elements that break it. */
export interface IAxeViolation {
  id: string
  impact?: 'minor' | 'moderate' | 'serious' | 'critical' | null
  help: string
  helpUrl: string
  nodes: Array<{ target: unknown[]; html: string; failureSummary?: string }>
}

/** What axe reports for a run. */
export interface IAxeResults {
  violations: IAxeViolation[]
}

/** The axe tags of WCAG 2.1 levels A and AA and of WCAG 2.2 level AA. */
export declare const WCAG_TAGS: string[]

/**
 * Runs axe over a rendered component: the container `render` returns, or a part of it.
 *
 * @param element What to check
 * @param options axe run options for this call
 */
export declare function axeComponent(
  element: Element,
  options?: Record<string, unknown>
): Promise<IAxeResults>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /** Passes when axe found no violation in the results. */
      toHaveNoViolations(): R
    }
  }
}
