import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'

/**
 * The count of selected items a section of the setup dialog shows beside its search: one item in
 * the singular («1 valgt element»), none or several in the plural («2 valgte elementer»).
 *
 * @param count How many of the selected items the section lists
 */
export function getSelectedCountText(count: number): string {
  return count === 1 ? strings.SelectedCountOneLabel : format(strings.SelectedCountLabel, count)
}
