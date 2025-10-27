import { IItem } from '@pnp/sp/items/types'
import { ItemFieldValues } from '../models'

/**
 * Get field values for an item. Expands `Id`, `Title`, and `EMail` for
 * the provided user fields in parameter `userFields`.
 *
 * @param item Item to get field values from
 * @param userFields User fields to include in the select and expand
 * @param excludeTemplateParameters If true, excludes TemplateParameters field from the select
 *
 * @returns an instance of `ItemFieldValues`
 */
export async function getItemFieldValues(
  item: IItem,
  userFields: string[] = [],
  excludeTemplateParameters: boolean = false
) {
  const selectFields = [
    '*',
    ...(excludeTemplateParameters ? [] : ['TemplateParameters']),
    ...userFields.map((fieldName) => `${fieldName}/Id`),
    ...userFields.map((fieldName) => `${fieldName}/Title`),
    ...userFields.map((fieldName) => `${fieldName}/EMail`)
  ]

  const [fieldValuesAsText, fieldValues] = await Promise.all([
    item.fieldValuesAsText<Record<string, string>>(),
    item.select(...selectFields).expand(...userFields)<Record<string, any>>()
  ])
  return ItemFieldValues.create({ fieldValues, fieldValuesAsText })
}
