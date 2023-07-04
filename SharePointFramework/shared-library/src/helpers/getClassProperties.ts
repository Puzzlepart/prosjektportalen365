/**
 * Get the properties of a class.
 *
 * @param constructor Constructor of the class to get the properties from
 */
export function getClassProperties(constructor: any): string[] {
  try {
    return Object.keys(new constructor())
  } catch (error) {
    return []
  }
}
