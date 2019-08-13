import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '@pnp/polyfill-ie11';
import * as strings from 'TemplateSelectorCommandSetStrings';
import { DocumentTemplateModal } from '../../components';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';
import * as data from '../../data';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { TemplateFile, IDocumentLibrary } from '../../models';

Logger.subscribe(new ConsoleListener());
Logger.activeLogLevel = LogLevel.Info;


export default class TemplateSelectorCommandSet extends BaseListViewCommandSet<ITemplateSelectorCommandSetProperties> {
  private _templates: TemplateFile[];
  private _libraries: IDocumentLibrary[];
  private _container: Element;

  constructor() {
    super();
    this._templates = [];
  }

  @override
  public async onInit() {
    sp.setup({ spfxContext: this.context });
    const OPEN_TEMPLATE_SELECTOR_COMMAND: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (OPEN_TEMPLATE_SELECTOR_COMMAND) {
      Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Initializing', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      try {
        this._templates = await data.getDocumentTemplates(sp, this.context.pageContext, this.properties.templateLibrary, this.properties.phaseTermSetId);
        Logger.log({ message: `(TemplateSelectorCommandSet) onInit: Retrieved ${this._templates.length} templates from the specified template library`, level: LogLevel.Info });
      } catch (error) {
        console.log(error);
        Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Failed to initialize', level: LogLevel.Warning });
      }
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
  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {
    switch (event.itemId) {
      case 'OPEN_TEMPLATE_SELECTOR':
        this._libraries = (
          await sp.web.lists
            .select('Id', 'Title', 'RootFolder/ServerRelativeUrl')
            .expand('RootFolder')
            .filter(`BaseTemplate eq 101 and IsCatalog eq false and IsApplicationList eq false and ListItemEntityTypeFullName ne 'SP.Data.FormServerTemplatesItem'`)
            .usingCaching()
            .get()
        ).map(l => ({
          Id: l.Id,
          Title: l.Title,
          ServerRelativeUrl: l.RootFolder.ServerRelativeUrl,
        }));
        this.onOpenTemplateSelector();
        break;
    }
  }

  /**
   * On open <DocumentTemplateModal />
   */
  private onOpenTemplateSelector() {
    const templateLibrarySelectModal = React.createElement(DocumentTemplateModal, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: this.onDismissTemplateLibrarySelectModal,
      libraries: this._libraries,
      templates: this._templates,
    });
    this._container = document.createElement('DIV');
    document.body.appendChild(this._container);
    ReactDOM.render(templateLibrarySelectModal, this._container);
  }

  /**
   * On dismiss <DocumentTemplateModal />
   */
  private onDismissTemplateLibrarySelectModal = () => {
    ReactDOM.unmountComponentAtNode(this._container);
  }
}
