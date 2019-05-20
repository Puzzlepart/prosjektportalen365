import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HubSiteService, { IHubSite } from 'sp-hubsite-service';
import * as strings from 'TemplateSelectorCommandSetStrings';
import { TemplateLibrarySelectModal } from '../../components';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';
import { getHubItems, getCurrentPhase } from '../../data';
import { TemplateFile } from '../../models';

export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private _hub: IHubSite;
  private _currentPhase: string;
  private _templates: TemplateFile[];
  private _container: Element;

  @override
  public async onInit() {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      try {
        const { pageContext } = this.context;
        this._hub = await HubSiteService.GetHubSiteById(pageContext.web.absoluteUrl, pageContext.legacyPageContext.hubSiteId);
        this._currentPhase = await getCurrentPhase(this._hub, 'abcfc9d9-a263-4abb-8234-be973c46258a', pageContext.site.id.toString());
        this._templates = await getHubItems(
          this._hub,
          'Dokumenter',
          TemplateFile,
          {
            ViewXml: `<View>
            <Query>
                <Where>
                    <Or>
                        <Or>
                            <Eq>
                                <FieldRef Name="GtProjectPhase" />
                                <Value Type="Text">${this._currentPhase}</Value>
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
        OPEN_TEMPLATE_SELECTOR_COMMAND.title = strings.TemplateLibrarySelectModalTitle;
        OPEN_TEMPLATE_SELECTOR_COMMAND.visible = true;
      } catch (error) { }
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      OPEN_TEMPLATE_SELECTOR_COMMAND.visible = event.selectedRows.length === 0;
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
  @autobind
  private onDismissTemplateLibrarySelectModal() {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
