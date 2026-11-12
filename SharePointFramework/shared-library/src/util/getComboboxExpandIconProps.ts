import strings from 'SharedLibraryStrings'

/**
 * Props for the button that opens a Fluent `Combobox`'s list, its `expandIcon` slot, named from the
 * strings: Fluent names it «Open», in English, whatever the page's language, and in a `Field` it is
 * not told the field's label (WCAG 3.1.2, 4.1.2). Fluent keeps the chevron as its content and the
 * button out of the tab order; the arrow keys in the input open the list as well.
 *
 * @returns The `expandIcon` slot's props: `<Combobox expandIcon={getComboboxExpandIconProps()} />`
 */
export function getComboboxExpandIconProps(): { 'aria-label': string } {
  return { 'aria-label': strings.Aria.ComboboxExpandLabel }
}
