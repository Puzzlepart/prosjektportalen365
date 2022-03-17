import { TypedHash } from '@pnp/common'
import { Web } from '@pnp/sp'
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import { Schema } from 'sp-js-provisioning'

export interface IProjectTemplateSPItem {
  Id?: number
  IsDefaultTemplate?: boolean
  IsDefaultExtensionsLocked?: boolean
  IsDefaultListContentLocked?: boolean
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
  GtProjectPhaseTermId: string
}

export class ProjectTemplate implements IDropdownOption {
  public id: number
  public key: string
  public text: string
  public subText: string
  public isDefault: boolean
  public isDefaultExtensionsLocked: boolean
  public isDefaultListContentLocked: boolean
  public iconName: string
  public listContentConfigIds: number[]
  public projectTemplateId: number
  public projectTemplateUrl: string
  public listExtensionIds: number[]
  public projectContentType: string
  public projectStatusContentType: string
  public projectColumns: string
  public projectCustomColumns: string
  public projectPhaseTermId: string

  constructor(spItem: IProjectTemplateSPItem, public web: Web) {
    this.id = spItem.Id
    this.key = `Template${this.id}`
    this.text = spItem.FieldValuesAsText.Title
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.isDefault = spItem?.IsDefaultTemplate
    this.isDefaultExtensionsLocked = spItem?.IsDefaultExtensionsLocked
    this.isDefaultListContentLocked = spItem?.IsDefaultListContentLocked
    this.iconName = spItem.IconName
    this.listContentConfigIds =
      spItem.ListContentConfigLookupId?.length > 0 ? spItem.ListContentConfigLookupId : null
    this.projectTemplateId = spItem.GtProjectTemplateId
    this.listExtensionIds =
      spItem.GtProjectExtensionsId?.length > 0 ? spItem.GtProjectExtensionsId : null
    this.projectContentType = spItem.GtProjectContentType
    this.projectStatusContentType = spItem.GtProjectStatusContentType
    this.projectColumns = spItem.GtProjectColumns
    this.projectCustomColumns = spItem.GtProjectCustomColumns
    this.projectPhaseTermId = spItem.GtProjectPhaseTermId
  }

  public async getSchema(): Promise<Schema> {
    const schema = await this.web.getFileByServerRelativeUrl(this.projectTemplateUrl).getJSON()
    schema.Parameters = schema.Parameters || {}
    schema.Parameters.ProjectContentTypeId =
      this?.projectContentType ?? schema.Parameters.ProjectContentTypeId
    schema.Parameters.ProjectStatusContentTypeId =
      this?.projectStatusContentType ?? schema.Parameters.ProjectStatusContentTypeId
    schema.Parameters.ProvisionSiteFields =
      this?.projectColumns ?? schema.Parameters.ProvisionSiteFields
    schema.Parameters.CustomSiteFields =
      this?.projectCustomColumns ?? schema.Parameters.CustomSiteFields
    if (!schema.Parameters.TermSetIds) {
      schema.Parameters.TermSetIds = {}
    }
    schema.Parameters.TermSetIds.GtProjectPhase =
      this?.projectPhaseTermId ?? schema.Parameters.TermSetIds.GtProjectPhase
    return schema
  }
}
