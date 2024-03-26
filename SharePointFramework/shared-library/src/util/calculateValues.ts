/**
 * Calculate the sum or average of the values in the sum field based on the sumType.
 * @param sumField - An array containing the sum field information. The array should have the following structure:
 *   - sumField[0]: The internal name of the field to calculate the sum from.
 *   - sumField[1]: The type of sum to calculate. Valid values are 'Add' for sum and 'Avg' for average.
 *   - sumField[2]: The description of the sum field.
 *   - sumField[3] (optional): The type to render the result as. Defaults to 'number'. Can be 'currency' or 'percentage'.
 * @param items - An array of items to calculate the sum from.
 * @returns An object containing the summation result, description of the sum field, and the render type.
 */
export const calculateValues = (sumField: any, items: any) => {
  if (sumField.length === 0 || items.length === 0) return null

  const fieldName = sumField[0]
  const sumType = sumField[1]
  const description = sumField[2]
  const renderAs = sumField[3] ?? 'number'
  const values = items?.map((item) => item[fieldName]?.replace(/[%,.a-zA-Z\s]/g, '')).map(Number)

  let result = 0
  if (sumType === 'Add') {
    result = values.reduce((sum: number, value: number) => sum + value, 0)
  } else if (sumType === 'Avg') {
    const sum = values.reduce((sum: number, value: number) => sum + value, 0)
    result = sum / values.length
  }

  return { result, description, renderAs }
}
