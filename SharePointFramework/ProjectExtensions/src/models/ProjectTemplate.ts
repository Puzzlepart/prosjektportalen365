import { TypedHash } from '@pnp/common'
import { Web } from '@pnp/sp'
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import { Schema } from 'sp-js-provisioning'

export interface IProjectTemplateSPItem {
  Id?: number
  IsDefaultTemplate?: boolean
  IconName?: string
  ListContentConfigLookupId?: number[]
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
  FieldValuesAsText?: TypedHash<string>
  GtProjectTemplateId?: number
  GtProjectExtensionsId?: number[]
  GtProjectColumns: string
  GtProjectCustomColumns: string
  GtProjectContentType: string
  GtProjectStatusContentType: string
}

export class ProjectTemplate implements IDropdownOption {
  public id: number
  public key: string
  public text: string
  public subText: string
  public isDefault: boolean
  public iconName: string
  public serverRelativeUrl: string
  public listContentConfigIds: number[]
  public projectTemplateId: number
  public listExtensionIds: number[]
  public projectContentType: string
  public projectStatusContentType: string
  public projectColumns: string
  public projectCustomColumns: string

  constructor(spItem: IProjectTemplateSPItem, public web: Web) {
    this.id = spItem.Id
    this.key = `Template${this.id}`
    this.text = spItem.FieldValuesAsText.Title
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.isDefault = spItem?.IsDefaultTemplate
    this.iconName = spItem.IconName
    this.listContentConfigIds =
      spItem.ListContentConfigLookupId && spItem.ListContentConfigLookupId.length > 0
        ? spItem.ListContentConfigLookupId
        : null
    this.projectTemplateId = spItem.GtProjectTemplateId
    this.listExtensionIds =
      spItem.GtProjectExtensionsId && spItem.GtProjectExtensionsId.length > 0
        ? spItem.GtProjectExtensionsId
        : null
    this.projectContentType = spItem.GtProjectContentType
    this.projectStatusContentType = spItem.GtProjectStatusContentType
    this.projectColumns = spItem.GtProjectColumns
    this.projectCustomColumns = spItem.GtProjectCustomColumns

    this.setServerRelativeUrl()
  }

  public async getSchema(): Promise<Schema> {
    const schema = await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
      schema.Parameters.ProjectContentTypeId = this?.projectContentType
      schema.Parameters.ProjectStatusContentTypeId = this?.projectStatusContentType
      schema.Parameters.ProvisionSiteFields = this?.projectColumns
      schema.Parameters.CustomSiteFields = this?.projectCustomColumns
    return schema
  }

  private async setServerRelativeUrl(): Promise<void> {
    const fileInfo = await this.web.lists
      .getByTitle('Prosjektmaler')
      .items.expand('File')
      .getById(this.projectTemplateId)
      .file.get()
    this.serverRelativeUrl = fileInfo.ServerRelativeUrl
  }
}
