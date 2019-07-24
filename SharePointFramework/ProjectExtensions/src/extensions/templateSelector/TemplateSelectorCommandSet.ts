import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HubSiteService from 'sp-hubsite-service';
import '@pnp/polyfill-ie11';
import * as strings from 'TemplateSelectorCommandSetStrings';
import { TemplateLibrarySelectModal } from '../../components';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';
import { getHubItems, getCurrentPhase } from '../../data';
import { TemplateFile } from '../../models';

export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private _templates: TemplateFile[];
  private _container: Element;

  constructor() {
    super();
    this._templates = [];
  }

  @override
  public async onInit() {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      try {
        const { pageContext } = this.context;
        const hub = await HubSiteService.GetHubSiteById(pageContext.web.absoluteUrl, pageContext.legacyPageContext.hubSiteId);
        const currentPhase = await getCurrentPhase(hub, this.properties.phaseTermSetId || 'abcfc9d9-a263-4abb-8234-be973c46258a', pageContext.site.id.toString());
        this._templates = await getHubItems(
          hub,
          this.properties.templateLibrary || 'Malbibliotek',
          TemplateFile,
          {
            ViewXml: `<View>
            <Query>
                <Where>
                    <Or>
                        <Or>
                            <Eq>
                                <FieldRef Name="GtProjectPhase" />
                                <Value Type="Text">${currentPhase}</Value>
                            </Eq>
                            <Eq>
                                <FieldRef Name="GtProjectPhase" />
                                <Value Type="Text">Flere faser</Value>
                            </Eq>
                        </Or>
                        <Eq>
                            <FieldRef Name="GtProjectPhase" />
                            <Value Type="Text">Ingen fase</Value>
                        </Eq>
                    </Or>
                </Where>
            </Query>
        </View>` },
          ['File'],
        );
      } catch (error) { }
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      OPEN_TEMPLATE_SELECTOR_COMMAND.visible = event.selectedRows.length === 0 && this._templates.length > 0;
    }
  }

  @override
  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'OPEN_TEMPLATE_SELECTOR':
        this.onOpenTemplateSelector();
        break;
    }
  }

  /**
   * On open <TemplateLibrarySelectModal />
   */
  private onOpenTemplateSelector() {
    const templateLibrarySelectModal = React.createElement(TemplateLibrarySelectModal, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: this.onDismissTemplateLibrarySelectModal,
      libraryServerRelativeUrl: this.context.pageContext.list.serverRelativeUrl,
      templates: this._templates,
    });
    this._container = document.createElement('DIV');
    document.body.append(this._container);
    ReactDOM.render(templateLibrarySelectModal, this._container);
  }

  /**
   * On dismiss <TemplateLibrarySelectModal />
   */
  private onDismissTemplateLibrarySelectModal =() => {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
