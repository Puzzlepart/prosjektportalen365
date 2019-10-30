import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base';
import { isArray } from '@pnp/common';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp, Web } from '@pnp/sp';
import { getId } from '@uifabric/utilities';
import { default as MSGraphHelper } from 'msgraph-helper';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApplicationInsightsLogListener, ListLogger } from 'shared/lib/logging';
import { PortalDataService } from 'shared/lib/services';
import { default as HubSiteService } from 'sp-hubsite-service';
import { ErrorDialog, IErrorDialogProps, IProgressDialogProps, ITemplateSelectDialogProps, ITemplateSelectDialogState, ProgressDialog, TemplateSelectDialog } from '../../components';
import { ListContentConfig, ProjectExtension, ProjectTemplate } from '../../models';
import * as Tasks from '../../tasks';
import { IProjectSetupData } from './IProjectSetupData';
import { IProjectSetupProperties } from './IProjectSetupProperties';
import { ProjectSetupError } from './ProjectSetupError';
import { ProjectSetupValidation } from './ProjectSetupValidation';

export default class ProjectSetup extends BaseApplicationCustomizer<IProjectSetupProperties> {
  private _portal: PortalDataService;
  private _placeholderIds = {
    ErrorDialog: getId('errordialog'),
    ProgressDialog: getId('progressdialog'),
    TemplateSelectDialog: getId('templateselectdialog'),
  };

  @override
  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context });
    Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = (sessionStorage.DEBUG === '1' || DEBUG) ? LogLevel.Info : LogLevel.Warning;
    if (!this.context.pageContext.legacyPageContext.isSiteAdmin || !this.context.pageContext.legacyPageContext.groupId) return;
    try {
      Logger.log({ message: '(ProjectSetup) onInit: Initializing pre-conditionals before initializing setup', data: { version: this.context.manifest.version, validation: this._validation }, level: LogLevel.Info });
      switch (this._validation) {
        case ProjectSetupValidation.InvalidWebLanguage: {
          await this._deleteCustomizer(this.componentId, false);
          throw new ProjectSetupError('onInit', strings.InvalidLanguageErrorMessage, strings.InvalidLanguageErrorStack);
        }
        case ProjectSetupValidation.NoHubConnection: {
          throw new ProjectSetupError('onInit', strings.NoHubSiteErrorMessage, strings.NoHubSiteErrorStack);
        }
        case ProjectSetupValidation.InvalidCulture: {
          throw new ProjectSetupError('onInit', strings.ProfileLanguageIncorrectErrorMessage, strings.ProfileLanguageIncorrectErrorStack);
        }
      }

      this._initializeSetup({
        web: new Web(this.context.pageContext.web.absoluteUrl),
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        templateExcludeHandlers: [],
        context: this.context,
        properties: this.properties,
      });

    } catch (error) {
      Logger.log({ message: '(ProjectSetup) [onInit]: Failed initializing pre-conditionals', data: error, level: LogLevel.Error });
      this._renderErrorDialog({ error });
    }
  }

  /**
   * Intiialize setup
   * 
   * @param {Tasks.IBaseTaskParams} taskParams Task params
   */
  private async _initializeSetup(taskParams: Tasks.IBaseTaskParams) {
    try {
      Logger.log({ message: '(ProjectSetup) [_initializeSetup]: Initializing setup', data: { version: this.context.manifest.version, placeholderIds: this._placeholderIds }, level: LogLevel.Info });
      let data = await this._fetchData();
      this._initializeSPListLogging(data.hub.web);
      const provisioningInfo = await this._getProvisioningInfo(data);
      Logger.log({ message: '(ProjectSetup) [_initializeSetup]: Template selected by user', data: {}, level: LogLevel.Info });
      data = { ...data, ...provisioningInfo };
      Logger.log({ message: '(ProjectSetup) [_initializeSetup]: Rendering progress modal', data: {}, level: LogLevel.Info });
      this._renderProgressDialog({ text: strings.ProgressDialogLabel, subText: strings.ProgressDialogDescription, iconName: 'Page' });
      await this._startProvision(taskParams, data);
      await this._deleteCustomizer(this.componentId, true);
    } catch (error) {
      Logger.log({ message: '(ProjectSetup) [_initializeSetup]: Failed initializing setup', data: error, level: LogLevel.Error });
      this._renderErrorDialog({ error });
    }
  }

  /**
   * Get provisioning info from TemplateSelectDialog
   * 
   * @param {IProjectSetupData} data Data
   */
  private _getProvisioningInfo(data: IProjectSetupData): Promise<ITemplateSelectDialogState> {
    return new Promise((resolve, reject) => {
      let placeholder = this._getPlaceholder('TemplateSelectDialog');
      const element = React.createElement<ITemplateSelectDialogProps>(TemplateSelectDialog, {
        data,
        version: this.manifest.version,
        onSubmit: (state: ITemplateSelectDialogState) => {
          this._unmount(placeholder);
          resolve(state);
        },
        onDismiss: () => {
          this._unmount(placeholder);
          reject(new ProjectSetupError('_getProvisioningInfo', strings.SetupAbortedText, strings.SetupAbortedText));
        },
      });
      ReactDOM.render(element, placeholder);
    });
  }

  /**
   * Render ProgressDialog
   * 
   * @param {IProgressDialogProps} props Props
   */
  private _renderProgressDialog(props: IProgressDialogProps) {
    let placeholder = this._getPlaceholder('ProgressDialog');
    const element = React.createElement<IProgressDialogProps>(ProgressDialog, { ...props, version: this.manifest.version });
    ReactDOM.render(element, placeholder);
  }

  /**
   * Render ErrorDialog
   * 
   * @param {IProgressDialogProps} props Props
   */
  private _renderErrorDialog(props: IErrorDialogProps) {
    let progressDialog = this._getPlaceholder('ProgressDialog');
    this._unmount(progressDialog);
    let placeholder = this._getPlaceholder('ErrorDialog');
    const element = React.createElement(ErrorDialog, {
      ...props,
      version: this.manifest.version,
      onDismiss: () => this._unmount(placeholder),
    });
    ReactDOM.render(element, placeholder);
  }

  /**
  * Start provision
   * 
   * @param {Tasks.IBaseTaskParams} taskParams Task params   
   * @param {IProjectSetupData} data Data
  */
  private async _startProvision(taskParams: Tasks.IBaseTaskParams, data: IProjectSetupData): Promise<void> {
    const tasks = Tasks.getTasks(data);
    Logger.log({ message: '(ProjectSetup) [_startProvision]', data: { properties: this.properties, tasks: tasks.map(t => t.taskName) }, level: LogLevel.Info });
    try {
      await ListLogger.write('Starting provisioning of project.', 'Info');
      for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        if (isArray(this.properties.tasks) && ['PreTask', ...this.properties.tasks].indexOf(task.taskName) === -1) continue;
        Logger.log({ message: `(ProjectSetup) [_startProvision]: Executing task ${task.taskName}`, level: LogLevel.Info });
        taskParams = await task.execute(taskParams, this._onTaskStatusUpdated.bind(this));
      }
      await ListLogger.write('Project successfully provisioned.', 'Info');
    } catch (error) {
      throw error;
    }
  }

  /**
   * On task status updated
   * 
   * @param {string} text Text
   * @param {string} subText Sub text
   * @param {string} iconName Icon name
   */
  private _onTaskStatusUpdated(text: string, subText: string, iconName: string) {
    this._renderProgressDialog({ text, subText, iconName });
  }

  /**
   * Delete customizer
   * 
   * @param {string} componentId Component ID
   * @param {boolean} reload Reload page after customizer removal
   */
  private async _deleteCustomizer(componentId: string, reload: boolean): Promise<void> {
    const web = new Web(this.context.pageContext.web.absoluteUrl);
    const customActions = await web.userCustomActions.get<{ Id: string, ClientSideComponentId: string }[]>();
    for (let i = 0; i < customActions.length; i++) {
      var customAction = customActions[i];
      if (customAction.ClientSideComponentId === componentId) {
        Logger.log({ message: `(ProjectSetup) [_deleteCustomizer]: Deleting custom action ${customAction.Id}`, level: LogLevel.Info });
        await web.userCustomActions.getById(customAction.Id).delete();
        break;
      }
    }
    if (reload) {
      window.location.href = window.location.href;
    }
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectSetupData> {
    try {
      Logger.log({ message: '(ProjectSetup) [_fetchData]: Retrieving required data for setup', data: { version: this.context.manifest.version }, level: LogLevel.Info });
      await MSGraphHelper.Init(this.context.msGraphClientFactory);
      Logger.log({ message: '(ProjectSetup) [_fetchData]: Retrieving hub site url', data: {}, level: LogLevel.Info });
      let data: IProjectSetupData = {};
      data.hub = await HubSiteService.GetHubSite(sp, this.context.pageContext);
      this._portal = new PortalDataService().configure({ urlOrWeb: data.hub.web });
      Logger.log({ message: '(ProjectSetup) [_fetchData]: Retrieved hub site url', data: { hubUrl: data.hub.url }, level: LogLevel.Info });
      Logger.log({ message: '(ProjectSetup) [_fetchData]: Retrieving templates, extensions and content config', data: {}, level: LogLevel.Info });
      const [templates, extensions, listContentConfig] = await Promise.all([
        this._portal.getItems(this.properties.templatesLibrary, ProjectTemplate, { ViewXml: '<View></View>' }, ['File', 'FieldValuesAsText']),
        this._portal.getItems(this.properties.extensionsLibrary, ProjectExtension, { ViewXml: '<View></View>' }, ['File', 'FieldValuesAsText']),
        this._portal.getItems(this.properties.contentConfigList, ListContentConfig),
      ]);
      Logger.log({ message: '(ProjectSetup) [_fetchData]: Retrieved templates, extensions and content config', data: { templates: templates.length, extensions: extensions.length, listContentConfig: listContentConfig.length }, level: LogLevel.Info });
      return {
        ...data,
        templates,
        extensions,
        listContentConfig,
      };
    } catch (error) {
      throw new ProjectSetupError('_fetchData', strings.GetSetupDataErrorMessage, strings.GetSetupDataErrorStack);
    }
  }

  private get _validation(): ProjectSetupValidation {
    if (this.context.pageContext.web.language !== 1044) return ProjectSetupValidation.InvalidWebLanguage;
    if (!this.context.pageContext.legacyPageContext.hubSiteId) return ProjectSetupValidation.NoHubConnection;
    if (this.context.pageContext.legacyPageContext.currentCultureLCID !== 1044 || this.context.pageContext.legacyPageContext.currentLanguage !== 1044) return ProjectSetupValidation.InvalidCulture;
    return ProjectSetupValidation.Ready;
  }

  private _unmount(container: HTMLElement) {
    ReactDOM.unmountComponentAtNode(container);
  }

  private get _container() {
    const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top);
    return topPlaceholder.domElement;
  }

  private _getPlaceholder(key: 'ErrorDialog' | 'ProgressDialog' | 'TemplateSelectDialog') {
    const id = this._placeholderIds[key];
    let placeholder = document.getElementById(id);
    if (placeholder === null) {
      placeholder = document.createElement('DIV');
      placeholder.id = this._placeholderIds[key];
      placeholder.setAttribute('name', key);
      return this._container.appendChild(placeholder);
    }
    return placeholder;
  }

  /**
   * Init SP list logging
   * 
   * @param {Web} hubWeb Hub web
   * @param {string} listName List name
   */
  private _initializeSPListLogging(hubWeb: Web, listName: string = 'Logg') {
    ListLogger.init(
      hubWeb.lists.getByTitle(listName),
      {
        webUrl: 'GtLogWebUrl',
        scope: 'GtLogScope',
        functionName: 'GtLogFunctionName',
        message: 'GtLogMessage',
        level: 'GtLogLevel',
      },
      this.context.pageContext.web.absoluteUrl,
      'ProjectSetup',
    );
  }
}

export { IProjectSetupData };
