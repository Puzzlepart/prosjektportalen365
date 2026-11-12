/**
 * Get the properties of a class. Only initialized properties are returned.
 */
export function getClassProperties(constructor: new () => any): string[] {
  try {
    return Object.keys(new constructor())
  } catch (error) {
    return []
  }
}
