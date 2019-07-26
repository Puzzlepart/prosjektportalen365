import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import HubSiteService from 'sp-hubsite-service';
import '@pnp/polyfill-ie11';
import * as strings from 'TemplateSelectorCommandSetStrings';
import { TemplateLibrarySelectModal } from '../../components';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';
import * as data from '../../data';
import { TemplateFile } from '../../models';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';


export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private templates: TemplateFile[] = [];
  private container: Element;

  constructor() {
    super();
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  @override
  public async onInit() {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Initializing', data: { version: this.context.manifest.version }, level: LogLevel.Info });
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      try {
        const hub = await HubSiteService.GetHubSite(this.context.pageContext);
        Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Retrieved hub site', data: { url: hub.url }, level: LogLevel.Info });
        const currentPhase = await data.getCurrentPhase(hub, this.properties.phaseTermSetId || 'abcfc9d9-a263-4abb-8234-be973c46258a', this.context.pageContext.site.id.toString());
        Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Retrieved current phase', data: { currentPhase }, level: LogLevel.Info });
        this.templates = await data.getHubItems(
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
        Logger.log({ message: `(TemplateSelectorCommandSet) onInit: Retrieved ${this.templates.length} templates`, level: LogLevel.Info });
      } catch (error) {
        console.log(error);
        Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Failed to initialize', data: { error }, level: LogLevel.Info });
      }
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      OPEN_TEMPLATE_SELECTOR_COMMAND.visible = event.selectedRows.length === 0 && this.templates.length > 0;
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
      templates: this.templates,
    });
    this.container = document.createElement('DIV');
    document.body.appendChild(this.container);
    ReactDOM.render(templateLibrarySelectModal, this.container);
  }

  /**
   * On dismiss <TemplateLibrarySelectModal />
   */
  private onDismissTemplateLibrarySelectModal = () => {
    ReactDOM.unmountComponentAtNode(this.container);
  }
}
