import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'

/** Formats the setup section's selected count with singular or plural wording. */
export function getSelectedCountText(count: number): string {
  return count === 1 ? strings.SelectedCountOneLabel : format(strings.SelectedCountLabel, count)
}
