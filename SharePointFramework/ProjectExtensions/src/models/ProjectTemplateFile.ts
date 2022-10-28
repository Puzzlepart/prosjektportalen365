import { IProjectTemplateSPItem } from 'models'

/**
 * @model ProjectTemplateFile
 */
export class ProjectTemplateFile {
  public id: number
  public serverRelativeUrl: string
  public name: string

  constructor(item: IProjectTemplateSPItem) {
    this.id = item.Id
    this.name = item.File.Name
    this.serverRelativeUrl = item.File.ServerRelativeUrl
  }
}
