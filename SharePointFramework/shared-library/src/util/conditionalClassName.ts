/**
 * Get conditional class name
 *
 * @param classNames Array of class names
 */
export function conditionalClassName(classNames: string[] = []): string {
  return classNames.filter(Boolean).join(' ')
}
