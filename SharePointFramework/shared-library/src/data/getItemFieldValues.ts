import { IItem } from '@pnp/sp/items/types'
import { ItemFieldValues } from '../models'

export type GetItemFieldValuesOptions = {
  /**
   * If `true`, excludes `TemplateParameters` from the `$select` clause.
   */
  excludeTemplateParameters?: boolean

  /**
   * Optional async hook to mutate the raw field-values record after it's been
   * fetched and before `ItemFieldValues` is constructed. Used to patch up
   * fields whose REST representation needs additional resolution — e.g. the
   * taxonomy-label resolver in `resolveTaxonomyFieldLabels`.
   */
  postProcess?: (fieldValues: Record<string, any>) => Promise<void>
}

/**
 * Get field values for an item. Expands `Id`, `Title`, and `EMail` for
 * the provided user fields in parameter `userFields`.
 *
 * @param item Item to get field values from
 * @param userFields User fields to include in the select and expand
 * @param options Either an options bag, or a boolean shorthand for
 *   `excludeTemplateParameters` (preserves the legacy call signature).
 *
 * @returns an instance of `ItemFieldValues`
 */
export async function getItemFieldValues(
  item: IItem,
  userFields: string[] = [],
  options: GetItemFieldValuesOptions | boolean = {}
) {
  const opts: GetItemFieldValuesOptions =
    typeof options === 'boolean' ? { excludeTemplateParameters: options } : options ?? {}

  const selectFields = [
    '*',
    ...(opts.excludeTemplateParameters ? [] : ['TemplateParameters']),
    ...userFields.map((fieldName) => `${fieldName}/Id`),
    ...userFields.map((fieldName) => `${fieldName}/Title`),
    ...userFields.map((fieldName) => `${fieldName}/EMail`)
  ]

  const [fieldValuesAsText, fieldValues] = await Promise.all([
    item.fieldValuesAsText<Record<string, string>>(),
    item.select(...selectFields).expand(...userFields)<Record<string, any>>()
  ])
  if (opts.postProcess) await opts.postProcess(fieldValues)
  return ItemFieldValues.create({ fieldValues, fieldValuesAsText })
}
