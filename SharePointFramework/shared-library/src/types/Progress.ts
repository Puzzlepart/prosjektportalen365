/**
 * Progress reported by a long-running operation and rendered on a progress bar.
 *
 * Replaces `IProgressIndicatorProps` from Fluent UI v8, which was being used as
 * a data carrier between adapters and dialogs rather than as component props.
 * Only the three fields that were ever set are declared here; the v9
 * `ProgressBar` has no label or description of its own, so those are rendered
 * by the surrounding `Field`.
 */
export interface IProgressProps {
  /**
   * Headline for the operation.
   */
  label?: string

  /**
   * Detail line, usually the step currently running.
   */
  description?: string

  /**
   * Completion between 0 and 1. Omit for an indeterminate bar.
   */
  percentComplete?: number
}
