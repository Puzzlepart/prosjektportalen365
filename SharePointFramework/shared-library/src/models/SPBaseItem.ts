export class SPBaseItem {
  public Title: string = ''

  public get fields(): string[] {
    return Object.keys(this)
  }
}
