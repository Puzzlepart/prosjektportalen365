/**
 * Props for the WebPartTitle component.
 */
export interface IWebPartTitleProps {
  /**
   * The title to display in the component.
   */
  title?: string

  /**
   * Props for the informational tooltip to display when hovering over the component.
   */
  description?: any

  /**
   * The heading's level: 2 for a web part's title (the default), 3 for a section's title inside a
   * web part, such as the parent projects in the project information.
   */
  headingLevel?: 2 | 3
}
