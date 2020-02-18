import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderContent, PlaceholderName } from '@microsoft/sp-application-base';
import { sp } from '@pnp/sp';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PortalDataService } from 'shared/lib/services/PortalDataService';
import { default as HubSiteService } from 'sp-hubsite-service';
import { HelpContent } from '../../components';
import { HelpContentModel } from '../../models/HelpContentModel';
import { IHelpContentApplicationCustomizerProperties } from './IHelpContentApplicationCustomizerProperties';

export default class HelpContentApplicationCustomizer extends BaseApplicationCustomizer<IHelpContentApplicationCustomizerProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;

  @override
  public async onInit(): Promise<void> {
    if (!this._topPlaceholder) this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top, { onDispose: this._onDispose });
    if (!this._topPlaceholder) return;
    if (!this._topPlaceholder.domElement) return;
    await this._start();
    this.context.application.navigatedEvent.add(this, this._start);

  }

  private async _start() {
    let helpContent = await this._getHelpContent('Hjelpeinnhold');
    let helpContentId = 'pp-help-content';
    let helpContentPlaceholder = document.getElementById(helpContentId);
    if (helpContentPlaceholder == null) {
      helpContentPlaceholder = document.createElement('DIV');
      helpContentPlaceholder.id = helpContentId;
      this._topPlaceholder.domElement.appendChild(helpContentPlaceholder);
    }
    if (helpContent.length == 0) ReactDOM.render(null, helpContentPlaceholder);
    else ReactDOM.render(<HelpContent linkText='Hjelp tilgjengelig' content={helpContent} />, helpContentPlaceholder);
  }

  /**
   * Get help content from the specified list
   * 
   * @param {string} listName Name of the list
   */
  private async _getHelpContent(listName: string) {
    let hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
    let portal = new PortalDataService().configure({ urlOrWeb: hub.web });
    let items = await portal.getItems(listName, HelpContentModel);
    for (let i = 0; i < items.length; i++) {
      if (items[i].externalUrl) {
        await items[i].fetchExternalContent();
      }
    }
    return items.filter(i => i.matchPattern(window.location.pathname));
  }

  private _onDispose(): void { }
}
