export function getDateValue(item: any, fieldName: string): string {
  return isNaN(item[fieldName]) ? '' : item[fieldName]
}
