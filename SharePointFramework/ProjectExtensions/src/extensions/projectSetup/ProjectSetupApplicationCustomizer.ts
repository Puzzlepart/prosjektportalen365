import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { override } from '@microsoft/decorators';
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base';
import { sp } from '@pnp/sp';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IProjectSetupApplicationCustomizerProperties } from './IProjectSetupApplicationCustomizerProperties';
import { ProgressModal, IProgressModalProps, ErrorModal, IErrorModalProps, TemplateSelectModal } from '../../components';
import HubSiteService from 'sp-hubsite-service';
import IProjectSetupApplicationCustomizerData from './IProjectSetupApplicationCustomizerData';
import { ListContentConfig, ProjectTemplate } from './../../models';
import { Tasks, IBaseTaskParams } from './../../tasks';
import MSGraphHelper from 'msgraph-helper';
import ListLogger from '../../../../@Shared/lib/logging/ListLogger';
import { ProjectSetupError } from './ProjectSetupError';

export default class ProjectSetupApplicationCustomizer extends BaseApplicationCustomizer<IProjectSetupApplicationCustomizerProperties> {
  private domElement: HTMLDivElement;
  private templateSelectModalContainer: HTMLElement;
  private progressModalContainer: HTMLElement;
  private data: IProjectSetupApplicationCustomizerData;
  private taskParams: IBaseTaskParams;

  public constructor() {
    super();
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  @override
  public async onInit(): Promise<void> {
    const { isSiteAdmin, groupId, hubSiteId } = this.context.pageContext.legacyPageContext;
    if (isSiteAdmin && groupId) {
      try {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) onInit: Initializing pre-conditionals before initializing setup', data: {}, level: LogLevel.Info });
        const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top);
        this.domElement = topPlaceholder.domElement;
        if (this.context.pageContext.web.language !== 1044) {
          await this.removeCustomizer(this.componentId, false);
          throw new ProjectSetupError(strings.InvalidLanguageErrorMessage, strings.InvalidLanguageErrorStack);
        } else if (!hubSiteId) {
          throw new ProjectSetupError(strings.NoHubSiteErrorMessage, strings.NoHubSiteErrorStack);
        } else {
          this.initializeSetup();
        }
      } catch (error) {
        this.renderErrorModal({ error });
      }
    }
  }

  /**
   * Intiialize setup
   */
  protected async initializeSetup() {
    try {
      this.injectStyle(`.SPPageChrome { opacity: 0.4; } .SPCanvas { visibility: hidden; } `);
      this.data = await this.getData();
      this.initLogging(this.data.hub.web);
      const templateInfo = await this.getTemplateInfo();
      ReactDOM.unmountComponentAtNode(this.templateSelectModalContainer);
      this.data = { ...this.data, ...templateInfo };
      this.taskParams = {
        context: this.context,
        properties: this.properties,
        data: this.data,
        templateParameters: { fieldsgroup: strings.SiteFieldsGroupName },
      };
      this.renderProgressModal({ text: strings.ProgressModalLabel, subText: strings.ProgressModalDescription, iconName: 'Page' });
      await this.runTasks();
    } catch (error) {
      await ListLogger.write(`${error.taskName} failed with message ${error.message}`, 'Error');
      this.renderErrorModal({ error });
    }
  }

  /**
   * Init logging
   * 
   * @param {Web} hubWeb Hub web
   * @param {string} listName List name
   */
  protected initLogging(hubWeb: any, listName: string = 'Logg') {
    ListLogger.init(
      hubWeb.lists.getByTitle(listName), {
        webUrl: 'GtLogWebUrl',
        scope: 'GtLogScope',
        functionName: 'GtLogFunctionName',
        message: 'GtLogMessage',
        level: 'GtLogLevel',
      },
      document.location.href,
      'ProjectSetupApplicationCustomizer',
    );
  }

  /**
   * Inject style
   * 
   * @param {string} css CSS 
   */
  private injectStyle(css: string) {
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    head.appendChild(style);
    style.type = 'text/css';
    if (style['styleSheet']) {
      style['styleSheet'].cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  /**
   * Render TemplateSelectModal
   */
  private getTemplateInfo(): Promise<IProjectSetupApplicationCustomizerData> {
    return new Promise(resolve => {
      const templateSelectModal = React.createElement(TemplateSelectModal, {
        key: 'ProjectSetupApplicationCustomizer_TemplateSelectModal',
        data: this.data,
        onSubmit: (data: IProjectSetupApplicationCustomizerData) => resolve(data),
        isBlocking: true,
        isDarkOverlay: true,
        version: `v${this.manifest.version}`,
      });
      this.templateSelectModalContainer = document.createElement('DIV');
      this.domElement.appendChild(this.templateSelectModalContainer);
      ReactDOM.render(templateSelectModal, this.templateSelectModalContainer);
    });
  }

  /**
   * Render ProgressModal
   * 
   * @param {IProgressModalProps} props Props
   */
  private renderProgressModal(props: IProgressModalProps) {
    const progressModal = React.createElement(ProgressModal, {
      key: 'ProjectSetupApplicationCustomizer_ProgressModal',
      ...props,
      taskParams: this.taskParams,
      isBlocking: true,
      isDarkOverlay: true,
      version: `v${this.manifest.version}`,
    });
    if (!this.progressModalContainer) {
      this.progressModalContainer = document.createElement('DIV');
      this.domElement.appendChild(this.progressModalContainer);
    }
    ReactDOM.render(progressModal, this.progressModalContainer);
  }

  /**
   * Render ErrorModal
   * 
   * @param {IProgressModalProps} props Props
   */
  private renderErrorModal(props: IErrorModalProps) {
    const errorModal = React.createElement(ErrorModal, {
      key: 'ProjectSetupApplicationCustomizer_ProgressModal',
      version: `v${this.manifest.version}`,
      ...props,
    });
    if (!this.progressModalContainer) {
      this.progressModalContainer = document.createElement('DIV');
      this.domElement.appendChild(this.progressModalContainer);
    }
    ReactDOM.render(errorModal, this.progressModalContainer);
  }

  /**
  * Run tasks
  */
  private async runTasks(): Promise<void> {
    Logger.log({ message: '(ProjectSetupApplicationCustomizer) runTasks', data: { properties: this.properties, tasks: Tasks.map(t => t.name) }, level: LogLevel.Info });
    try {
      await ListLogger.write('Starting provisioning of project.');
      this.taskParams.templateSchema = await this.taskParams.data.selectedTemplate.getSchema();
      for (let i = 0; i < Tasks.length; i++) {
        this.taskParams = await Tasks[i].execute(this.taskParams, this.onTaskStatusUpdated);
      }
      await ListLogger.write('Project successfully provisioned.');
      await this.removeCustomizer(this.componentId, !this.isDebug());
    } catch (error) {
      throw error;
    }
  }

  /**
   * On task status updated
   * 
   * @param {string} status Status
   * @param {string} iconName Icon name
   */
  @autobind
  private onTaskStatusUpdated(status: string, iconName: string) {
    this.renderProgressModal({ text: strings.ProgressModalLabel, subText: status, iconName });
  }

  /**
   * Remove customizer
   * 
   * @param {string} componentId Component ID
   * @param {boolean} reload Reload page after customizer removal
   */
  private async removeCustomizer(componentId: string, reload: boolean): Promise<void> {
    let customActions = await sp.web.userCustomActions.get();
    for (let i = 0; i < customActions.length; i++) {
      var { ClientSideComponentId, Id } = customActions[i];
      if (ClientSideComponentId === componentId) {
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) removeCustomizer: Removing custom action ${Id}`, level: LogLevel.Info });
        await sp.web.userCustomActions.getById(Id).delete();
        break;
      }
    }
    if (reload) {
      window.location.href = this.context.pageContext.web.absoluteUrl;
    }
  }

  /**
   * Get data
   */
  private async getData(): Promise<IProjectSetupApplicationCustomizerData> {
    try {
      sp.setup({ spfxContext: this.context });
      await MSGraphHelper.Init(this.context.msGraphClientFactory, 'v1.0');
      let data: IProjectSetupApplicationCustomizerData = {};
      data.hub = await HubSiteService.GetHubSiteById(this.context.pageContext.web.absoluteUrl, this.context.pageContext.legacyPageContext.hubSiteId);
      const hubLists = data.hub.web.lists;
      const [templates, extensions, listContentConfig] = await Promise.all([
        (async () => (await hubLists.getByTitle(this.properties.templatesLibrary).rootFolder.files.get()).map(file => new ProjectTemplate(file, data.hub.web)))(),
        (async () => (await hubLists.getByTitle(this.properties.extensionsLibrary).rootFolder.files.get()).map(file => new ProjectTemplate(file, data.hub.web)))(),
        (async () => (await hubLists.getByTitle(this.properties.contentConfigList).items.get()).map(item => new ListContentConfig(item, data.hub.web)))(),
      ]);
      return {
        ...data,
        templates,
        extensions,
        listContentConfig,
      };
    } catch (e) {
      throw new ProjectSetupError(strings.GetSetupDataErrorMessage, strings.GetSetupDataErrorStack);
    }
  }

  /**
   * Is debug
   * 
   * Typically true when running 'gulp serve'
   */
  private isDebug(): boolean {
    return document.location.search.toLowerCase().indexOf('debugmanifestsfile') !== -1;
  }
}
