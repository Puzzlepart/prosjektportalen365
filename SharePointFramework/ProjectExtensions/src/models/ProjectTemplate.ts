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
  GtIsProgram: boolean
  IsHiddenTemplate: boolean
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
  public isProgram: boolean
  public isHidden: boolean

  constructor(spItem: IProjectTemplateSPItem, public web: Web) {
    this.id = spItem.Id
    this.key = `projecttemplate_${this.id}`
    this.text = spItem.File.Title
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.isDefault = spItem.IsDefaultTemplate
    this.iconName = spItem.IconName
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
    this.listContentConfigIds =
      spItem.ListContentConfigLookupId && spItem.ListContentConfigLookupId.length > 0
        ? spItem.ListContentConfigLookupId
        : null
    this.isProgram = spItem.GtIsProgram
    this.isHidden = spItem.IsHiddenTemplate
  }

  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
  }
}
