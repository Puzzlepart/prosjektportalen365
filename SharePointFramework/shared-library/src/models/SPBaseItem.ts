/**
 * Provides the common title field and selectable field names for list-item shapes.
 */
export class SPBaseItem {
  public Title: string = ''

  public get fields(): string[] {
    return Object.keys(this)
  }
}
