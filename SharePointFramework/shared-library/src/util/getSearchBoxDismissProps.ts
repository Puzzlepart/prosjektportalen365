import strings from 'SharedLibraryStrings'

/**
 * Props for the clear button of a Fluent `SearchBox`, its `dismiss` slot, named from the strings:
 * Fluent names it «clear», in English, whatever the page's language (WCAG 3.1.2, 4.1.2). It stays
 * out of the tab order, as Fluent keeps it; Escape in the box clears the search as well.
 *
 * @returns The `dismiss` slot's props: `<SearchBox dismiss={getSearchBoxDismissProps()} />`
 */
export function getSearchBoxDismissProps(): { 'aria-label': string } {
  return { 'aria-label': strings.Aria.SearchBoxClearLabel }
}
