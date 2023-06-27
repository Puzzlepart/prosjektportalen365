import { override } from '@microsoft/decorators'
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base'
import { dateAdd, PnPClientStorage } from '@pnp/common'
import { sp } from '@pnp/sp'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { HelpContent } from '../components'
import { HelpContentModel } from '../models/HelpContentModel'
import { IHelpContentApplicationCustomizerProperties } from './types'

export default class HelpContentApplicationCustomizer extends BaseApplicationCustomizer<
  IHelpContentApplicationCustomizerProperties
> {
  private _topPlaceholder: PlaceholderContent | undefined

  @override
  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context })
    if (!this._topPlaceholder)
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        {}
      )
    if (!this._topPlaceholder) return
    if (!this._topPlaceholder.domElement) return
    await this._render()
    this.context.application.navigatedEvent.add(this, this._render)
  }

  /**
   * Render function
   */
  private async _render(): Promise<void> {
    const helpContent = await this._getHelpContent(this.properties.listName)
    if (helpContent.length === 0) return
    const helpContentId = 'pp-help-content'
    let helpContentPlaceholder = document.getElementById(helpContentId)
    if (helpContentPlaceholder === null) {
      helpContentPlaceholder = document.createElement('DIV')
      helpContentPlaceholder.id = helpContentId
      helpContentPlaceholder.style.height = '30px'
      this._topPlaceholder.domElement.appendChild(helpContentPlaceholder)
    }
    if (helpContent.length === 0) ReactDOM.render(null, helpContentPlaceholder)
    else {
      ReactDOM.render(
        <HelpContent linkText={this.properties.linkText + ' (dev)'} content={helpContent} />,
        helpContentPlaceholder
      )
    }
  }

  /**
   * Get help content from the specified list. The content is stored in `sessionStorage` for 4 hours.
   *
   * @param listName Name of the list
   */
  private async _getHelpContent(listName: string): Promise<HelpContentModel[]> {
    try {
      return await new PnPClientStorage().session.getOrPut(
        `pp365_help_content_${window.location.pathname}`,
        async () => {
          const portal = await new PortalDataService().configure({
            pageContext: this.context.pageContext
          })
          let items = await portal.getItems(listName, HelpContentModel, {
            ViewXml:
              '<View><Query><OrderBy><FieldRef Name="GtSortOrder" /></OrderBy></Query></View>'
          })
          items = items.filter((i) => i.matchPattern(window.location.pathname)).splice(0, 3)
          for (let i = 0; i < items.length; i++) {
            if (items[i].externalUrl) {
              await items[i].fetchExternalContent(this.properties.publicMediaBasePath)
            }
          }
          return items
        },
        dateAdd(new Date(), 'hour', 4)
      )
    } catch (e) {
      return []
    }
  }
}
