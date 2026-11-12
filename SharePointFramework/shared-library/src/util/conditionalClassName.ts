/**
 * Joins truthy class names into a space-separated class attribute.
 */
export function conditionalClassName(classNames: string[] = []): string {
  return classNames.filter(Boolean).join(' ')
}
