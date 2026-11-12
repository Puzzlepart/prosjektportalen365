import { IProjectTemplateSPItem } from './ProjectTemplate'

/**
 * Exposes the template item's ID and its provisioning file's name and URL.
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
