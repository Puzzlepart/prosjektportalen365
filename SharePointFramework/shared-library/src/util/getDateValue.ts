/**
 * Get date value from item.
 *
 * @param item Item/record to get date value from.
 * @param fieldName The field name of the date value.
 */
export function getDateValue(item: Record<string, any>, fieldName: string): string {
  const dateValue = item[fieldName]
  if (!dateValue) return ''
  if (typeof dateValue === 'string') {
    return new Date(dateValue).toLocaleString()
  } else if (dateValue instanceof Date) {
    return dateValue.toLocaleString()
  }
}
