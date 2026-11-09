/**
 * The internal name of the project column a field of the project cards shows: what the property
 * panes' field dropdowns key their options by, and what the list view heads the field with. The
 * web parts are added with the text fields beside the columns (`GtProjectServiceAreaText` beside
 * `GtProjectServiceArea`), which the cards read as they read the column (`useProjectCardContent`)
 * but no column is named by, so «Primært felt» and «Sekundært felt» showed empty and the list view
 * headed them with those generic names. A text field gives its column; any other field is returned
 * as it is.
 *
 * @param field The field the cards show
 * @param options The project columns, keyed by their internal names
 */
export function getFieldOptionKey(field: string, options: { key: string }[] = []): string {
  const hasOption = (key: string) => options.some((option) => option.key === key)
  if (!field || hasOption(field)) return field
  const column = field.replace(/Text$/, '')
  return hasOption(column) ? column : field
}
