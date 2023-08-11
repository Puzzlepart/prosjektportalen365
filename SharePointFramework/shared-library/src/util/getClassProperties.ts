/**
 * Get the properties of a class. Only initialized properties are returned.
 *
 * @param constructor Constructor of the class to get the properties from
 */
export function getClassProperties(constructor: new () => any): string[] {
  try {
    return Object.keys(new constructor())
  } catch (error) {
    return []
  }
}
