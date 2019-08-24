import { override } from '@microsoft/decorators';
import { BaseListViewCommandSet, Command, IListViewCommandSetExecuteEventParameters, IListViewCommandSetListViewUpdatedParameters } from '@microsoft/sp-listview-extensibility';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as strings from 'TemplateSelectorCommandSetStrings';
import { DocumentTemplateModal } from '../../components';
import * as data from '../../data';
import { IDocumentLibrary, TemplateFile } from '../../models';
import { ITemplateSelectorCommandSetProperties } from './ITemplateSelectorCommandSetProperties';

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
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (!openTemplateSelectorCommand) return;
    Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Initializing', data: { version: this.context.manifest.version }, level: LogLevel.Info });
    try {
      this._templates = await data.getDocumentTemplates(sp, this.context.pageContext, this.properties.templateLibrary, this.properties.phaseTermSetId);
      Logger.log({ message: `(TemplateSelectorCommandSet) onInit: Retrieved ${this._templates.length} templates from the specified template library`, level: LogLevel.Info });
    } catch (error) {
      Logger.log({ message: '(TemplateSelectorCommandSet) onInit: Failed to initialize', level: LogLevel.Warning });
    }
  }

  @override
  public onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): void {
    const openTemplateSelectorCommand: Command = this.tryGetCommand('OPEN_TEMPLATE_SELECTOR');
    if (openTemplateSelectorCommand) {
      openTemplateSelectorCommand.visible = event.selectedRows.length === 0 && this._templates.length > 0;
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
        this._onOpenTemplateSelector();
        break;
    }
  }

  /**
   * On open <DocumentTemplateModal />
   */
  private _onOpenTemplateSelector() {
    const templateLibrarySelectModal = React.createElement(DocumentTemplateModal, {
      title: strings.TemplateLibrarySelectModalTitle,
      onDismiss: this._onDismissTemplateLibrarySelectModal.bind(this),
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
  private _onDismissTemplateLibrarySelectModal() {
    ReactDOM.unmountComponentAtNode(this._container);
    document.location.href = document.location.href;
  }
}
