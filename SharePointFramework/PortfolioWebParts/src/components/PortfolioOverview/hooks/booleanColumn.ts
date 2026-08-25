import { ProjectColumn } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'

/**
 * Field names that are treated as boolean even if the column itself isn't
 * configured with the `boolean` data type in the `Prosjektkolonner` list.
 */
const IMPLICIT_BOOLEAN_FIELD_NAMES = ['GtIsProgram', 'GtIsParentProject']

/**
 * `true` when the column holds a Yes/No value. Either the column is configured
 * with the `boolean` data type, or it's one of the built-in fields that are
 * always boolean.
 *
 * @param column Column to check
 */
export function isBooleanColumn(column: ProjectColumn): boolean {
  if (!column?.fieldName) return false
  // Deliberately only `dataType`, as that's the only property the list renderer
  // resolves `BooleanColumn` from - see `useOnRenderItemColumn` in
  // `components/List/ItemColumn`. Matching on more than the renderer does would
  // label a value `Ja`/`Nei` here while the list still shows the raw value.
  if (column.dataType === 'boolean') return true
  return IMPLICIT_BOOLEAN_FIELD_NAMES.some((name) => column.fieldName.includes(name))
}

/**
 * Normalizes a raw boolean value to `1` or `0`.
 *
 * Search omits properties without a value, and `cleanDeep` in `DataAdapter`
 * strips the ones that come back as `null` or empty, so an item that is `No`
 * often has no value at all. `BooleanColumn` renders those as the false label,
 * so grouping and filtering must treat them the same way.
 *
 * @param value Raw value
 */
export function normalizeBooleanValue(value: any): '1' | '0' {
  // Kept in sync with `isTrueBooleanValue` in the shared library, which
  // `BooleanColumn` renders from. Only the `1`/`0` strings that search returns
  // reach this web part, so parsing the value as a number is enough here.
  return parseInt(value) === 1 ? '1' : '0'
}

/**
 * Get the display label for a boolean value, honouring the custom
 * `valueIfTrue`/`valueIfFalse` labels set on the column, falling back to the
 * localized Yes/No strings - the same way `BooleanColumn` renders the value.
 *
 * Note that a column configured with a `fallbackValue` is not mirrored: the
 * list renderer returns that value for items without a value before it gets to
 * `BooleanColumn`, while those items are labelled as false here. The editor
 * only offers `fallbackValue` for currency columns, so that only happens if it
 * was left behind when the data type was changed.
 *
 * @param column Column the value belongs to
 * @param value Raw value
 */
export function getBooleanDisplayValue(column: ProjectColumn, value: any): string {
  const { valueIfTrue, valueIfFalse } = column?.data?.dataTypeProperties ?? {}
  // `??` and not `||`, so that an empty label stays empty, like the
  // `defaultProps` of `BooleanColumn` which only apply when it's `undefined`.
  return normalizeBooleanValue(value) === '1'
    ? valueIfTrue ?? strings.BooleanYes
    : valueIfFalse ?? strings.BooleanNo
}
