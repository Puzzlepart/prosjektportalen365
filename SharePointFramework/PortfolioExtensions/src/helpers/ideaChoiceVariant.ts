import { Choice } from 'models'
import { TelemetryVariant } from 'pp365-shared-library/lib/telemetry'

/** How usage statistics name what was chosen for an idea: recommended or decided. */
export type IdeaChoiceVariant = TelemetryVariant<'idea.recommended' | 'idea.decided'>

/**
 * The variant usage statistics count an idea's recommendation or decision under, from the key of
 * the chosen choice in the idea configuration (`approve`, `consideration`, `reject`, or a key the
 * customer has added). The key is the same in every language and whatever the customer calls the
 * choice; the text the dialog shows for it is never read here, and neither is sent.
 *
 * @param choiceKey The chosen choice's key in the idea configuration
 */
export function ideaChoiceVariant(choiceKey?: string): IdeaChoiceVariant {
  switch (choiceKey) {
    case Choice.Approve:
      return 'approve'
    case Choice.Consideration:
      return 'consider'
    case Choice.Reject:
      return 'reject'
    default:
      return 'other'
  }
}
