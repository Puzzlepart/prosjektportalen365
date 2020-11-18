import { Web } from '@pnp/sp'
import { IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown'
import { TypedHash } from '@pnp/common'
import { Schema } from 'sp-js-provisioning'

export interface IProjectExtension {
  Id: number
  FieldValuesAsText?: TypedHash<string>
  key: string
  GtExtensionDefault?: boolean
  File?: { UniqueId: string; Name: string; Title: string; ServerRelativeUrl: string }
}

export class ProjectExtension implements IDropdownOption {
  public key: string
  public text: string
  public isDefault: boolean
  public subText: string
  public serverRelativeUrl: string

  constructor(spItem: IProjectExtension, public web: Web) {
    this.key = `projecttemplate_${spItem.Id}`
    this.text = spItem.File.Title
    this.isDefault = spItem.GtExtensionDefault
    this.subText = spItem.FieldValuesAsText.GtDescription
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
  }

  public async getSchema(): Promise<Schema> {
    return await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getJSON()
  }
}
