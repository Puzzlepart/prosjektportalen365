import strings from 'SharedLibraryStrings'

/**
 * Props for the button that clears a Fluent `Dropdown`, its `clearButton` slot, named from the
 * strings: Fluent names it «Clear selection», in English, whatever the page's language (WCAG
 * 3.1.2, 4.1.2). Fluent renders it in every single-select `Dropdown`, hidden unless `clearable`
 * and something is selected, so it is named on all of ours.
 *
 * @returns The `clearButton` slot's props: `<Dropdown clearButton={getDropdownClearButtonProps()} />`
 */
export function getDropdownClearButtonProps(): { 'aria-label': string } {
  return { 'aria-label': strings.Aria.DropdownClearLabel }
}
