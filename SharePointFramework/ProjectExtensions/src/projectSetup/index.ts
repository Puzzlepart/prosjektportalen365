import { override } from '@microsoft/decorators'
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base'
import { isArray, stringIsNullOrEmpty } from '@pnp/common'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { sp, Web } from '@pnp/sp'
import { getId } from '@uifabric/utilities'
import { default as MSGraphHelper } from 'msgraph-helper'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { ListLogger } from 'pp365-shared/lib/logging'
import { PortalDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProjectExtensionsStrings'
import { createElement } from 'react'
import * as ReactDOM from 'react-dom'
import { default as HubSiteService } from 'sp-hubsite-service'
import {
  ErrorDialog,
  IErrorDialogProps,
  IProgressDialogProps,
  ITemplateSelectDialogProps,
  ITemplateSelectDialogState,
  ProgressDialog,
  TemplateSelectDialog
} from '../components'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from '../models'
import * as Tasks from './tasks'
import { deleteCustomizer } from './deleteCustomizer'
import { ProjectSetupError } from './ProjectSetupError'
import { IProjectSetupData, IProjectSetupProperties, ProjectSetupValidation } from './types'
import { ProjectSetupSettings } from './ProjectSetupSettings'
import { find } from 'underscore'
import { endsWith } from 'lodash'
import { ProjectSetupSettings } from './ProjectSetupSettings'

export default class ProjectSetup extends BaseApplicationCustomizer<IProjectSetupProperties> {
  private _portal: PortalDataService
  private isSetup = true
  private _placeholderIds = {
    ErrorDialog: getId('errordialog'),
    ProgressDialog: getId('progressdialog'),
    TemplateSelectDialog: getId('templateselectdialog')
  }

  @override
  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning
    if (
      !this.context.pageContext.legacyPageContext.isSiteAdmin ||
      !this.context.pageContext.legacyPageContext.groupId
    )
      return
    try {
      Logger.log({
        message: '(ProjectSetup) onInit: Initializing pre-conditionals before initializing setup',
        data: { version: this.context.manifest.version, validation: this._validation },
        level: LogLevel.Info
      })
      ;(await this._isProjectSetup()) ? (this.isSetup = true) : (this.isSetup = false)
      this.isSetup = await this._isProjectSetup()

      switch (this._validation) {
        case ProjectSetupValidation.InvalidWebLanguage: {
          await deleteCustomizer(this.context.pageContext.web.absoluteUrl, this.componentId, false)
          throw new ProjectSetupError(
            'InvalidWebLanguage',
            strings.InvalidLanguageErrorMessage,
            strings.InvalidLanguageErrorStack
          )
        }
        case ProjectSetupValidation.NoHubConnection: {
          throw new ProjectSetupError(
            'NoHubConnection',
            strings.NoHubSiteErrorMessage,
            strings.NoHubSiteErrorStack,
            MessageBarType.warning
          )
        }
        case ProjectSetupValidation.SkipTemplateSelection: {
          break
        }
        case ProjectSetupValidation.AlreadySetup: {
          if (!stringIsNullOrEmpty(this.properties.forceTemplate)) {
            throw new ProjectSetupError(
              'AlreadySetup',
              strings.ProjectAlreadySetupMessage,
              strings.ProjectAlreadySetupStack
            )
          }
        }
      }

      this._initializeSetup({
        web: new Web(this.context.pageContext.web.absoluteUrl) as any,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        templateExcludeHandlers: [],
        context: this.context,
        properties: this.properties
      })
    } catch (error) {
      Logger.log({
        message: '(ProjectSetup) [onInit]: Failed initializing pre-conditionals',
        data: error,
        level: LogLevel.Error
      })
      this._renderErrorDialog({ error })
    }
  }

  /**
   * Intiialize setup
   *
   * @param taskParams Task params
   */
  private async _initializeSetup(taskParams: Tasks.IBaseTaskParams) {
    try {
      Logger.log({
        message: '(ProjectSetup) [_initializeSetup]: Initializing setup',
        data: { version: this.context.manifest.version, placeholderIds: this._placeholderIds },
        level: LogLevel.Info
      })
      let data = await this._fetchData()
      this._initializeSPListLogging(data.hub.web)
      let provisioningInfo: ITemplateSelectDialogState

      if (this.properties.skipSelection) {
        const [defaultTemplate] = data.templates.filter(
          (template) => template.text.indexOf('Overordnet') != -1
        )
        provisioningInfo = {
          selectedExtensions: [],
          selectedListContentConfig: [],
          selectedTemplate: defaultTemplate,
          settings: new ProjectSetupSettings()
        }
      } else {
        provisioningInfo = await this._getProvisioningInfo(data)
      }

      Logger.log({
        message: '(ProjectSetup) [_initializeSetup]: Template selected by user',
        data: {},
        level: LogLevel.Info
      })
      data = { ...data, ...provisioningInfo }
      Logger.log({
        message: '(ProjectSetup) [_initializeSetup]: Rendering progress modal',
        data: {},
        level: LogLevel.Info
      })
      this._renderProgressDialog({
        text: strings.ProgressDialogLabel,
        subText: strings.ProgressDialogDescription,
        iconName: 'Page'
      })
      await this._startProvision(taskParams, data)
      await deleteCustomizer(
        this.context.pageContext.web.absoluteUrl,
        this.componentId,
        !this.properties.skipReload
      )
    } catch (error) {
      Logger.log({
        message: '(ProjectSetup) [_initializeSetup]: Failed initializing setup',
        data: error,
        level: LogLevel.Error
      })
      this._renderErrorDialog({ error })
    }
  }

  /**
   * Checks for force template
   *
   * @param data - Data
   */
  private _checkForceTemplate(data: IProjectSetupData): ITemplateSelectDialogState {
    if (stringIsNullOrEmpty(this.properties.forceTemplate)) return null
    const selectedTemplate = find(data.templates, (tmpl) =>
      endsWith(tmpl.serverRelativeUrl, this.properties.forceTemplate)
    )
    if (!selectedTemplate) return null
    return {
      selectedTemplate,
      selectedExtensions: [],
      selectedListContentConfig: [],
      settings: new ProjectSetupSettings().useDefault()
    }
  }

  /**
   * Get provisioning info from TemplateSelectDialog
   *
   * @param data - Data
   */
  private _getProvisioningInfo(data: IProjectSetupData): Promise<ITemplateSelectDialogState> {
    return new Promise((resolve, reject) => {
      const placeholder = this._getPlaceholder('TemplateSelectDialog')
      const forceTemplate = this._checkForceTemplate(data)
      if (forceTemplate !== null) {
        this._unmount(placeholder)
        resolve(forceTemplate)
      } else {
        const element = createElement<ITemplateSelectDialogProps>(TemplateSelectDialog, {
          data,
          version: this.manifest.version,
          onSubmit: (state: ITemplateSelectDialogState) => {
            this._unmount(placeholder)
            resolve(state)
          },
          onDismiss: () => {
            this._unmount(placeholder)
            reject(
              new ProjectSetupError(
                '_getProvisioningInfo',
                strings.SetupAbortedText,
                strings.SetupAbortedText
              )
            )
          }
        })
        ReactDOM.render(element, placeholder)
      }
    })
  }

  /**
   * Render ProgressDialog
   *
   * @param props Props
   */
  private _renderProgressDialog(props: IProgressDialogProps) {
    const placeholder = this._getPlaceholder('ProgressDialog')
    const element = createElement<IProgressDialogProps>(ProgressDialog, {
      ...props,
      version: this.manifest.version
    })
    ReactDOM.render(element, placeholder)
  }

  /**
   * Render ErrorDialog
   *
   * @param props Props
   */
  private _renderErrorDialog(props: IErrorDialogProps) {
    const progressDialog = this._getPlaceholder('ProgressDialog')
    this._unmount(progressDialog)
    const placeholder = this._getPlaceholder('ErrorDialog')
    const element = createElement<IErrorDialogProps>(ErrorDialog, {
      ...props,
      version: this.manifest.version,
      onDismiss: async () => {
        if (this.isSetup) {
          await deleteCustomizer(this.context.pageContext.web.absoluteUrl, this.componentId, false)
        }
        this._unmount(placeholder)
      },
      messageType: props.error['messageType'],
      onSetupClick: () => {
        this._initializeSetup({
          web: new Web(this.context.pageContext.web.absoluteUrl) as any,
          webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
          templateExcludeHandlers: [],
          context: this.context,
          properties: this.properties
        })
        this._unmount(placeholder)
      }
    })
    ReactDOM.render(element, placeholder)
  }

  /**
   * Start provision
   *
   * Get tasks using Tasks.getTasks and runs through them in sequence
   *
   * @param taskParams Task params
   * @param data Data
   */
  private async _startProvision(
    taskParams: Tasks.IBaseTaskParams,
    data: IProjectSetupData
  ): Promise<void> {
    const tasks = Tasks.getTasks(data)
    Logger.log({
      message: '(ProjectSetup) [_startProvision]',
      data: { properties: this.properties, tasks: tasks.map((t) => t.taskName) },
      level: LogLevel.Info
    })
    try {
      await ListLogger.write(strings.ProjectProvisioningStartLogText, 'Info')
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (
          isArray(this.properties.tasks) &&
          ['PreTask', ...this.properties.tasks].indexOf(task.taskName) === -1
        )
          continue
        Logger.log({
          message: `(ProjectSetup) [_startProvision]: Executing task ${task.taskName}`,
          level: LogLevel.Info
        })
        taskParams = await task.execute(taskParams, this._onTaskStatusUpdated.bind(this))
      }
      await ListLogger.write(strings.ProjectProvisioningSuccessLogText, 'Info')
    } catch (error) {
      throw error
    }
  }

  /**
   * On task status updated
   *
   * @param text Text
   * @param subText Sub text
   * @param iconName Icon name
   */
  private _onTaskStatusUpdated(text: string, subText: string, iconName: string) {
    this._renderProgressDialog({ text, subText, iconName })
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IProjectSetupData> {
    try {
      Logger.log({
        message: '(ProjectSetup) [_fetchData]: Retrieving required data for setup',
        data: { version: this.context.manifest.version },
        level: LogLevel.Info
      })
      await MSGraphHelper.Init(this.context.msGraphClientFactory)
      Logger.log({
        message: '(ProjectSetup) [_fetchData]: Retrieving hub site url',
        data: {},
        level: LogLevel.Info
      })
      const data: IProjectSetupData = {}
      data.hub = await HubSiteService.GetHubSite(sp, this.context.pageContext as any)
      this._portal = new PortalDataService().configure({ urlOrWeb: data.hub.web })
      Logger.log({
        message: '(ProjectSetup) [_fetchData]: Retrieved hub site url',
        data: { hubUrl: data.hub.url },
        level: LogLevel.Info
      })
      Logger.log({
        message: '(ProjectSetup) [_fetchData]: Retrieving templates, extensions and content config',
        data: {},
        level: LogLevel.Info
      })

      const templateFileName = (
        await sp.web.select('Title', 'AllProperties').expand('AllProperties').get()
      )['AllProperties']['pp_template']
      let templateViewXml = `<View Scope="RecursiveAll">
      <Query>
          <Where>
              <Eq>
                  <FieldRef Name="FSObjType" />
                  <Value Type="Integer">0</Value>
              </Eq>
          </Where>
      </Query>
  </View>`
      if (templateFileName) {
        templateViewXml = `<View Scope="RecursiveAll">
        <Query>
            <Where>
                <And>
                    <Eq>
                        <FieldRef Name="FSObjType" />
                        <Value Type="Integer">0</Value>
                    </Eq>
                    <Eq>
                        <FieldRef Name="FileLeafRef" />
                        <Value Type="Text">${templateFileName}</Value>
                    </Eq>
                </And>
            </Where>
        </Query>
    </View>`
      }

      const [templates, extensions, listContentConfig] = await Promise.all([
        this._portal.getItems(
          this.properties.templatesLibrary,
          ProjectTemplate,
          {
            ViewXml: templateViewXml
          },
          ['File', 'FieldValuesAsText']
        ),
        this.properties.extensionsLibrary
          ? this._portal.getItems(
            this.properties.extensionsLibrary,
            ProjectExtension,
            {
              ViewXml:
                '<View Scope="RecursiveAll"><Query><Where><Eq><FieldRef Name="FSObjType" /><Value Type="Integer">0</Value></Eq></Where></Query></View>'
            },
            ['File', 'FieldValuesAsText']
          )
          : Promise.resolve([]),
        this.properties.contentConfigList
          ? this._portal.getItems(this.properties.contentConfigList, ListContentConfig)
          : Promise.resolve([])
      ])
      Logger.log({
        message: '(ProjectSetup) [_fetchData]: Retrieved templates, extensions and content config',
        data: {
          templates: templates.length,
          extensions: extensions.length,
          listContentConfig: listContentConfig.length
        },
        level: LogLevel.Info
      })
      return {
        ...data,
        templates,
        extensions,
        listContentConfig
      }
    } catch (error) {
      throw new ProjectSetupError(
        '_fetchData',
        strings.GetSetupDataErrorMessage,
        strings.GetSetupDataErrorStack
      )
    }
  }

  /**
   * Get validation
   */
  private get _validation(): ProjectSetupValidation {
    if (this.context.pageContext.web.language !== 1044)
      return ProjectSetupValidation.InvalidWebLanguage
    if (!this.context.pageContext.legacyPageContext.hubSiteId)
      return ProjectSetupValidation.NoHubConnection
    if (this.properties.skipSelection) return ProjectSetupValidation.SkipTemplateSelection
    if (this.isSetup) return ProjectSetupValidation.AlreadySetup
    return ProjectSetupValidation.Ready
  }

  /**
   * Unmount component at container
   *
   * @param container Container
   */
  private _unmount(container: HTMLElement): boolean {
    return ReactDOM.unmountComponentAtNode(container)
  }

  /**
   * Get container
   */
  private get _container(): HTMLDivElement {
    const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top)
    return topPlaceholder.domElement
  }

  /**
   * Get placeholder by key
   *
   * @param key Key
   */
  private _getPlaceholder(key: 'ErrorDialog' | 'ProgressDialog' | 'TemplateSelectDialog') {
    const id = this._placeholderIds[key]
    let placeholder = document.getElementById(id)
    if (placeholder === null) {
      placeholder = document.createElement('DIV')
      placeholder.id = this._placeholderIds[key]
      placeholder.setAttribute('name', key)
      return this._container.appendChild(placeholder)
    }
    return placeholder
  }

  /**
   * Init SP list logging
   *
   * @param hubWeb Hub web
   * @param listName List name
   */
  private _initializeSPListLogging(hubWeb: Web, listName: string = 'Logg') {
    ListLogger.init(
      hubWeb.lists.getByTitle(listName),
      {
        webUrl: 'GtLogWebUrl',
        scope: 'GtLogScope',
        functionName: 'GtLogFunctionName',
        message: 'GtLogMessage',
        level: 'GtLogLevel'
      },
      this.context.pageContext.web.absoluteUrl,
      'ProjectSetup'
    )
  }

  /**
   * Check if the project is previously set up.
   */
  private async _isProjectSetup() {
    const { WelcomePage } = await sp.web.rootFolder.select('WelcomePage').get()
    if (WelcomePage === 'SitePages/Home.aspx') return false
    return true
  }
}

export { IProjectSetupData }
