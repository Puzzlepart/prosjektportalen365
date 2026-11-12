import { override } from '@microsoft/decorators'
import { BaseApplicationCustomizer, PlaceholderName } from '@microsoft/sp-application-base'
import { isArray, stringIsNullOrEmpty } from '@pnp/core'
import { ConsoleListener, LogLevel, Logger } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { IMenuNode, INavigationNodes } from '@pnp/sp/navigation'
import { PermissionKind } from '@pnp/sp/security'
import strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import { SPDataAdapter } from 'data'
import msgraph from 'msgraph-helper'
import {
  ContentConfig,
  ListLogger,
  PortalDataService,
  ProjectExtension,
  ProjectTemplate,
  ProjectTemplateFile,
  createSpfiInstance,
  format,
  getId,
  renderReact,
  unmountReact
} from 'pp365-shared-library'
import { createElement } from 'react'
import _ from 'underscore'
import {
  ErrorDialog,
  IErrorDialogProps,
  IProgressDialogProps,
  IProjectSetupDialogProps,
  IProjectSetupDialogState,
  ProgressDialog,
  ProjectSetupDialog
} from '../../components'
import { ITaskProgress } from '../../components/ProgressDialog/types'
import { ProjectSetupError } from './ProjectSetupError'
import { NAVIGATION_NODES_STORAGE_KEY } from './constants'
import { deleteCustomizer } from './deleteCustomizer'
import { isAddedBefore } from './listContentRecord'
import { TemplateQuickLaunch } from './templateQuickLaunch'
import * as Tasks from './tasks'
import { IProjectSetupData, IProjectSetupProperties, ProjectSetupValidation } from './types'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Warning

/** Validates the site and coordinates project provisioning, dialogs and navigation restoration. */
export default class ProjectSetup extends BaseApplicationCustomizer<IProjectSetupProperties> {
  public sp: SPFI
  private _portalDataService: PortalDataService
  private _isSetup = true
  private _placeholderIds = {
    ErrorDialog: getId('errordialog'),
    ProgressDialog: getId('progressdialog'),
    TemplateSelectDialog: getId('templateselectdialog')
  }
  private _validation: ProjectSetupValidation
  private _taskProgress: ITaskProgress[] = []
  private _currentTaskIndex: number = 0
  private _totalTasks: number = 0

  @override
  public async onInit(): Promise<void> {
    this.sp = createSpfiInstance(this.context)
    await msgraph.Init(this.context.msGraphClientFactory)
    try {
      this._isSetup = await this._isProjectSetup()
      this._validation = await this._validateProjectSetup()

      switch (this._validation) {
        case ProjectSetupValidation.NotSiteAdmin: {
          throw new ProjectSetupError(
            'NotSiteAdmin',
            strings.NotSiteAdminErrorMessage,
            strings.NotSiteAdminErrorStack
          )
        }
        case ProjectSetupValidation.NoGroupId: {
          await deleteCustomizer(this)
          throw new ProjectSetupError(
            'NoGroupId',
            strings.NoGroupIdErrorMessage,
            strings.NoGroupIdErrorStack
          )
        }
        case ProjectSetupValidation.IsTeamChannel: {
          Logger.write(
            `(ProjectSetup) Site is a Teams channel (${this.context.pageContext.web.absoluteUrl}); removing setup customizer silently.`,
            LogLevel.Info
          )
          await deleteCustomizer(this)
          return
        }
        case ProjectSetupValidation.InvalidWebLanguage: {
          await deleteCustomizer(this)
          throw new ProjectSetupError(
            'InvalidWebLanguage',
            strings.InvalidLanguageErrorMessage,
            strings.InvalidLanguageErrorStack
          )
        }
        case ProjectSetupValidation.IsHubSite: {
          await deleteCustomizer(this)
          throw new ProjectSetupError(
            'IsHubSite',
            strings.IsHubSiteErrorMessage,
            strings.IsHubSiteErrorStack
          )
        }
        case ProjectSetupValidation.NoHubConnection: {
          throw new ProjectSetupError(
            'NoHubConnection',
            strings.NoHubSiteErrorMessage,
            strings.NoHubSiteErrorStack,
            'warning'
          )
        }
        case ProjectSetupValidation.AlreadySetup: {
          const skipViaSession = sessionStorage.getItem('pp_skipAlreadySetupCheck') === 'true'
          if (skipViaSession) {
            sessionStorage.removeItem('pp_skipAlreadySetupCheck')
          }
          Logger.write(
            `(ProjectSetup) AlreadySetup check: forceTemplate='${this.properties.forceTemplate}', skipAlreadySetupCheck=${this.properties.skipAlreadySetupCheck}, skipViaSession=${skipViaSession}`,
            LogLevel.Warning
          )
          if (
            stringIsNullOrEmpty(this.properties.forceTemplate) &&
            !this.properties.skipAlreadySetupCheck &&
            !skipViaSession
          ) {
            throw new ProjectSetupError(
              'AlreadySetup',
              strings.ProjectAlreadySetupMessage,
              strings.ProjectAlreadySetupStack
            )
          }
        }
      }

      await this._removeAlternativeLanguages()

      void this._initializeSetup({
        sp: this.sp,
        web: this.sp.web,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        templateExcludeHandlers: ['Hooks'],
        context: this.context,
        properties: this.properties
      })
    } catch (error) {
      this._renderErrorDialog({ error, showStackAsSubText: true })
    }
  }

  private async _ensureParentProjectPatch(): Promise<void> {
    const [singleItem] = await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_Projects_Title)
      .items.filter(
        `GtSiteId eq '${this.context.pageContext.legacyPageContext.siteId.replace(/([{}])/g, '')}'`
      )()
    await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_Projects_Title)
      .items.getById(singleItem.Id)
      .update({ GtIsParentProject: true })
  }

  /** Loads setup choices, runs provisioning and handles completion or recoverable errors. */
  private async _initializeSetup(taskParams: Tasks.IBaseTaskParams) {
    try {
      await SPDataAdapter.configure(this.context, {
        siteId: this.context.pageContext.site.id.toString(),
        webUrl: this.context.pageContext.web.absoluteUrl
      })

      let data = await this._fetchData()
      ListLogger.init(
        SPDataAdapter.portalDataService.web.lists.getByTitle(resource.Lists_Log_Title),
        this.context.pageContext.web.absoluteUrl,
        'ProjectSetup'
      )

      const languageRemovedKey = `pp_languagesRemoved_${this.context.pageContext.site.id.toString()}`
      if (sessionStorage.getItem(languageRemovedKey) === 'true') {
        sessionStorage.removeItem(languageRemovedKey)
        await this._logToHub(data, {
          message: `Removed alternative languages from site: ${this.context.pageContext.web.title}`,
          functionName: '_removeAlternativeLanguages',
          component: 'ProjectSetup'
        })
      }

      const provisioningInfo = await this._getSetupInfo(data)
      data = { ...data, ...provisioningInfo }
      this._renderProgressDialog({
        progressIndicator: {
          label: strings.ProgressDialogLabel,
          description: strings.ProgressDialogDescription
        },
        iconName: data.selectedTemplate?.iconProps?.iconName ?? 'Page',
        title: this.properties.progressDialogTitle,
        subText: this.properties.progressDialogSubText
      })
      const { declaredQuickLaunch } = await this._startSetup(taskParams, data)

      // Run again («Kjør oppsettveiviser», `__SELECT_TEMPLATE__`) or made a parent project: the
      // template's menu has replaced the one the owners had.
      if (!stringIsNullOrEmpty(this.properties.forceTemplate)) {
        await this._restoreQuickLaunch(declaredQuickLaunch)
      }
      if (
        !stringIsNullOrEmpty(this.properties.forceTemplate) &&
        this.properties.forceTemplate !== '__SELECT_TEMPLATE__'
      ) {
        await this.sp.web.lists
          .getByTitle(resource.Lists_ProjectProperties_Title)
          .items.getById(1)
          .update({ GtIsParentProject: true, GtChildProjects: JSON.stringify([]) })
        if (data.hasHubWriteAccess !== false) {
          await this._ensureParentProjectPatch()
        }
      }

      await deleteCustomizer(this)
      if (!this.properties.skipReload) {
        this._renderProgressDialog({
          progressIndicator: {
            label: strings.ProgressDialogLabel,
            description: strings.ProgressDialogDescription
          },
          iconName: data.selectedTemplate?.iconProps?.iconName ?? 'Page',
          title: this.properties.progressDialogTitle,
          subText: this.properties.progressDialogSubText,
          taskProgress: this._taskProgress,
          currentStep: this._totalTasks,
          totalSteps: this._totalTasks,
          isComplete: true,
          warning: this._getCompletionWarning(data),
          onDismiss: () => {
            window.location.href = this.context.pageContext.web.absoluteUrl
          }
        })
      }
    } catch (error) {
      if (this._taskProgress?.some((task) => task.status === 'error')) {
        this._renderProgressDialog({
          progressIndicator: {
            label: strings.ProgressDialogLabel,
            description: strings.ProgressDialogDescription
          },
          iconName: 'ErrorBadge',
          title: this.properties.progressDialogTitle,
          subText: this.properties.progressDialogSubText,
          taskProgress: this._taskProgress,
          currentStep: this._currentTaskIndex,
          totalSteps: this._totalTasks,
          error,
          onDismiss: async () => {
            if (this._isSetup) {
              await deleteCustomizer(this)
            }
            this._unmount(this._getPlaceholder('ProgressDialog'))
          }
        })
      } else {
        this._renderErrorDialog({ error })
      }
    }
  }

  /** Summarizes logged task failures and missing portfolio registration before dismissal. */
  private _getCompletionWarning(data: IProjectSetupData): IProgressDialogProps['warning'] {
    const notRegistered =
      data.hasHubWriteAccess === false
        ? {
            title: strings.ProjectNotRegisteredInHubTitle,
            text: format(strings.ProjectNotRegisteredInHubMessage, resource.Lists_Projects_Title)
          }
        : undefined
    const errorCount = this._getErrorEntries().length
    if (errorCount === 0) return notRegistered
    const text = format(strings.SetupCompletedWithErrorsMessage, errorCount)
    return {
      title: strings.SetupCompletedWithErrorsTitle,
      text: notRegistered ? `${text}\n\n**${notRegistered.title}.** ${notRegistered.text}` : text
    }
  }

  /** Collects error messages from tasks that completed with warnings. */
  private _getErrorEntries(): string[] {
    return this._taskProgress
      .filter(({ status }) => status === 'warning')
      .flatMap(({ name, entries }) =>
        entries.filter(({ level }) => level === 'error').map(({ message }) => `${name}: ${message}`)
      )
  }

  /**
   * Restores saved owner-added links removed by the provisioning engine's menu replacement.
   * Template-owned nodes stay excluded, including renamed titles and declared URLs
   * (see {@link TemplateQuickLaunch.declares}); refused nodes are logged and skipped.
   *
   * @param declaredQuickLaunch The `Navigation.QuickLaunch` the template and the extensions declare
   */
  private async _restoreQuickLaunch(declaredQuickLaunch?: Tasks.NavigationNodes[]): Promise<void> {
    const nodes = this._takeSavedQuickLaunch()
    if (!nodes) return
    const { web, site } = this.context.pageContext
    await this._restoreQuickLaunchLevel(
      nodes,
      TemplateQuickLaunch.of(declaredQuickLaunch, {
        webUrl: web.absoluteUrl,
        siteUrl: site?.absoluteUrl ?? web.absoluteUrl
      }),
      () => this.sp.web.navigation.quicklaunch,
      'the Quick Launch'
    )
  }

  /**
   * Consumes the saved Quick Launch only if it belongs to this web.
   * Local storage is shared by every site on the tenant.
   */
  private _takeSavedQuickLaunch(): IMenuNode[] | undefined {
    try {
      const json = localStorage.getItem(NAVIGATION_NODES_STORAGE_KEY)
      localStorage.removeItem(NAVIGATION_NODES_STORAGE_KEY)
      const saved = JSON.parse(json)
      const webUrl = this.context.pageContext.web.absoluteUrl.replace(/\/$/, '').toLowerCase()
      if (
        typeof saved?.webUrl === 'string' &&
        saved.webUrl.replace(/\/$/, '').toLowerCase() === webUrl &&
        isArray(saved.nodes)
      ) {
        return saved.nodes
      }
      Logger.write(
        '(ProjectSetup) No Quick Launch was saved for this site before the setup; nothing to add back.',
        LogLevel.Warning
      )
    } catch (error) {
      Logger.write(
        `(ProjectSetup) Could not read the Quick Launch saved before the setup: ${error?.message}`,
        LogLevel.Warning
      )
    }
    return undefined
  }

  /**
   * Recursively restores missing owner-added nodes beneath existing or restored parents.
   *
   * @param level Returns the level's nodes: a fresh queryable on every call, since `select()` sets
   * the query on the instance
   * @param stored The level's nodes when they are known (none under a node just added)
   */
  private async _restoreQuickLaunchLevel(
    saved: IMenuNode[],
    declared: TemplateQuickLaunch,
    level: () => INavigationNodes,
    label: string,
    stored?: Array<{ Id: number; Title: string }>
  ): Promise<void> {
    let nodes = stored
    if (!nodes) {
      try {
        nodes = await level().select('Id', 'Title')<Array<{ Id: number; Title: string }>>()
      } catch (error) {
        Logger.write(
          `(ProjectSetup) Could not read ${label} to add back the saved nodes: ${error?.message}`,
          LogLevel.Warning
        )
        return
      }
    }
    for (const node of saved) {
      if (!node?.Title || node.IsDeleted || node.Title === strings.RecycleBinText) continue
      let match = nodes.find(({ Title }) => Title === node.Title)
      const isAdded = !match
      if (isAdded) {
        // The template's own node, left out by the menu on purpose: it stays out, its children
        // with it.
        const reason = declared.declares(node.Title, node.SimpleUrl)
        if (reason) {
          Logger.write(
            `(ProjectSetup) Not adding back '${node.Title}' (${node.SimpleUrl}) to ${label}: ${reason}`,
            LogLevel.Info
          )
          continue
        }
        try {
          const { Id } = await level().add(node.Title, node.SimpleUrl)
          match = { Id, Title: node.Title }
          nodes.push(match)
          Logger.write(
            `(ProjectSetup) Added back '${node.Title}' (${node.SimpleUrl}) to ${label}`,
            LogLevel.Info
          )
        } catch (error) {
          Logger.write(
            `(ProjectSetup) Could not add back '${node.Title}' (${node.SimpleUrl}) to ${label}: ${error?.message}`,
            LogLevel.Warning
          )
          continue
        }
      }
      if (isArray(node.Nodes) && node.Nodes.length > 0) {
        const { Id } = match
        await this._restoreQuickLaunchLevel(
          node.Nodes,
          declared.childrenOf(node.Title),
          () => this.sp.web.navigation.quicklaunch.getById(Id).children,
          `the children of '${node.Title}' in the Quick Launch`,
          isAdded ? [] : undefined
        )
      }
    }
  }

  /**
   * Builds selections for a forced or auto-configurable template, excluding previously added content.
   *
   * @returns Null when no matching template is available.
   */
  private _checkAutoTemplate(data: IProjectSetupData): IProjectSetupDialogState {
    const autoTemplate = _.find(
      data.templates,
      ({ text, autoConfigure }) => text === this.properties.forceTemplate || autoConfigure
    )
    if (!autoTemplate) return null
    return {
      selectedTemplate: autoTemplate,
      selectedExtensions: data.extensions.filter((ext) => autoTemplate.extensions.includes(ext.id)),
      selectedContentConfig: data.contentConfig.filter(
        (content) =>
          autoTemplate.contentConfig.includes(content.id) &&
          !isAddedBefore(data.addedListContent, autoTemplate, content)
      )
    }
  }

  /** Resolves automatic selections or opens the setup wizard, rejecting if the user dismisses it. */
  private _getSetupInfo(data: IProjectSetupData): Promise<IProjectSetupDialogState> {
    return new Promise((resolve, reject) => {
      const placeholder = this._getPlaceholder('TemplateSelectDialog')
      const autoTemplate = this._checkAutoTemplate(data)
      if (autoTemplate !== null) {
        this._unmount(placeholder)
        resolve(autoTemplate)
      } else {
        const element = createElement<IProjectSetupDialogProps>(ProjectSetupDialog, {
          data,
          version: this.version,
          tasks: this.properties.tasks,
          onSubmit: (state: IProjectSetupDialogState) => {
            this._unmount(placeholder)
            resolve(state)
          },
          onDismiss: () => {
            this._unmount(placeholder)
            reject(
              // The user closed the wizard: information, not an error.
              new ProjectSetupError(
                '_getProvisioningInfo',
                strings.SetupAbortedText,
                strings.SetupAbortedMessage,
                'info'
              )
            )
          },
          validation: this._validation
        })
        renderReact(element, placeholder)
      }
    })
  }

  /** Renders setup progress with the current extension version. */
  private _renderProgressDialog(props: IProgressDialogProps) {
    const placeholder = this._getPlaceholder('ProgressDialog')
    const element = createElement<IProgressDialogProps>(ProgressDialog, {
      ...props,
      version: this.version
    })
    renderReact(element, placeholder)
  }

  /** Replaces progress with an error dialog, allowing setup retry or conditional custom-action removal. */
  private _renderErrorDialog(props: IErrorDialogProps) {
    const progressDialog = this._getPlaceholder('ProgressDialog')
    this._unmount(progressDialog)
    const placeholder = this._getPlaceholder('ErrorDialog')
    const element = createElement<IErrorDialogProps>(ErrorDialog, {
      ...props,
      version: this.version,
      onDismiss: async () => {
        if (this._isSetup) {
          await deleteCustomizer(this)
        }
        this._unmount(placeholder)
      },
      intent: props.error['messageType'],
      onSetupClick: () => {
        void this._initializeSetup({
          sp: this.sp,
          web: this.sp.web,
          webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
          templateExcludeHandlers: ['Hooks'],
          context: this.context,
          properties: this.properties
        })
        this._unmount(placeholder)
      }
    })
    renderReact(element, placeholder)
  }

  /**
   * Runs the enabled tasks sequentially, tracking task logs and passing parameters between tasks.
   */
  private async _startSetup(
    taskParams: Tasks.IBaseTaskParams,
    data: IProjectSetupData
  ): Promise<Tasks.IBaseTaskParams> {
    const tasks = Tasks.getTasks(data)
    const activeTasks = tasks.filter(
      (task) =>
        !isArray(this.properties.tasks) ||
        ['PreTask', ...this.properties.tasks].indexOf(task.taskName) !== -1
    )

    this._taskProgress = activeTasks.map((task) => ({
      name: task.taskName,
      status: 'pending' as const,
      entries: []
    }))
    this._totalTasks = activeTasks.length
    this._currentTaskIndex = 0

    try {
      await this._logToHub(data, {
        message: format(
          strings.ProjectProvisioningStartLogText,
          this.context.pageContext.web.title
        ),
        functionName: '_startProvision',
        component: 'ProjectSetup'
      })
      for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i]
        this._currentTaskIndex = i
        this._taskProgress[i].status = 'running'
        this._renderCurrentProgress(
          task.taskName,
          '',
          data.selectedTemplate?.iconProps?.iconName ?? 'Page'
        )
        try {
          taskParams = await task.execute(taskParams, this._onTaskStatusUpdated.bind(this, i))
          // Completed with errors: the engine logs a failure and goes on, and so does the copy of
          // list items.
          this._taskProgress[i].status = this._taskProgress[i].entries.some(
            ({ level }) => level === 'error'
          )
            ? 'warning'
            : 'completed'
        } catch (error) {
          this._taskProgress[i].status = 'error'
          this._taskProgress[i].entries.push({
            timestamp: new Date(),
            message: error.message || String(error),
            level: 'error'
          })
          this._renderCurrentProgress(task.taskName, error.message, 'ErrorBadge')
          throw error
        }
      }
      const errors = this._getErrorEntries()
      await this._logToHub(
        data,
        errors.length > 0
          ? {
              message: [
                format(
                  strings.ProjectProvisioningErrorsLogText,
                  this.context.pageContext.web.title,
                  errors.length
                ),
                ...errors
              ].join('\n'),
              functionName: '_startProvision',
              component: 'ProjectSetup',
              level: 'Warning'
            }
          : {
              message: format(
                strings.ProjectProvisioningSuccessLogText,
                this.context.pageContext.web.title
              ),
              functionName: '_startProvision',
              component: 'ProjectSetup'
            }
      )
      return taskParams
    } catch (error) {
      await this._logToHub(data, {
        message: error.message,
        functionName: '_startProvision',
        component: 'ProjectSetup',
        scope: error.name,
        level: 'Error'
      })
      throw error
    }
  }

  /** Logs setup activity on the hub unless hub writes have been disabled. */
  private async _logToHub(data: IProjectSetupData, entry: Parameters<typeof ListLogger.log>[0]) {
    if (data.hasHubWriteAccess === false) return
    await ListLogger.log(entry)
  }

  /**
   * Render the current progress state to the ProgressDialog.
   */
  private _renderCurrentProgress(label: string, description: string, iconName: string) {
    this._renderProgressDialog({
      progressIndicator: { label, description },
      iconName,
      title: this.properties.progressDialogTitle,
      subText: this.properties.progressDialogSubText,
      taskProgress: this._taskProgress,
      currentStep: this._currentTaskIndex,
      totalSteps: this._totalTasks
    })
  }

  /** Appends task diagnostics and refreshes the progress dialog. */
  private _onTaskStatusUpdated(
    taskIndex: number,
    label: string,
    description: string,
    iconName: string,
    logEntry?: { message: string; level: 'info' | 'warning' | 'error' }
  ) {
    if (logEntry && this._taskProgress[taskIndex]) {
      this._taskProgress[taskIndex].entries.push({
        timestamp: new Date(),
        ...logEntry
      })
    } else if (description && this._taskProgress[taskIndex]) {
      this._taskProgress[taskIndex].entries.push({
        timestamp: new Date(),
        message: description,
        level: 'info'
      })
    }
    this._renderCurrentProgress(label, description, iconName)
  }

  /** Reads hub template options, restricting them to a property-bag lock unless a template is forced. */
  private async _getTemplates(propertyBagRegex = /^pp_.*_template$/): Promise<ProjectTemplate[]> {
    try {
      const webAllProperties = (
        await this.sp.web.select('Title', 'AllProperties').expand('AllProperties')()
      )['AllProperties']
      const lockedTemplateProperty = Object.keys(webAllProperties).find((key) =>
        propertyBagRegex.test(key)
      )

      const [lockedTemplateName, templates] = await Promise.all([
        webAllProperties[lockedTemplateProperty],
        this._portalDataService.getItems(
          resource.Lists_TemplateOptions_Title,
          ProjectTemplate,
          {
            ViewXml: '<View></View>'
          },
          ['FieldValuesAsText']
        )
      ])

      if (this.properties.forceTemplate) {
        return templates
      } else if (lockedTemplateName) {
        const lockedTemplate = templates.find((t) => t.text === lockedTemplateName)
        if (lockedTemplate) {
          lockedTemplate.isLocked = true
          return [lockedTemplate]
        }
      }
      return templates
    } catch (error) {
      throw new Error(`Error getting templates: ${error.message}`)
    }
  }

  /** Loads hub setup options, existing project metadata and hub-write capability. */
  private async _fetchData(): Promise<IProjectSetupData> {
    try {
      const data: IProjectSetupData = {}
      this._portalDataService = await new PortalDataService().configure({
        spfxContext: this.context
      })

      const [_templates, extensions, contentConfig, templateFiles, projectData, hasHubWriteAccess] =
        await Promise.all([
          this._getTemplates(),
          this._portalDataService.getItems(
            resource.Lists_ProjectExtensions_Title,
            ProjectExtension,
            {
              ViewXml:
                '<View Scope="RecursiveAll"><Query><Where><Eq><FieldRef Name="FSObjType" /><Value Type="Integer">0</Value></Eq></Where></Query></View>'
            },
            ['File', 'FieldValuesAsText']
          ),
          this._portalDataService.getItems(resource.Lists_ListContent_Title, ContentConfig, {}, [
            'File'
          ]),
          this._portalDataService.getItems(
            resource.Lists_ProjectTemplates_Title,
            ProjectTemplateFile,
            {
              ViewXml: '<View></View>'
            },
            ['File']
          ),
          this._portalDataService.getProjectData(),
          this._checkHubWriteAccess()
        ])
      const templates = _templates.map((tmpl) => {
        const [tmplFile] = templateFiles.filter((file) => file.id === tmpl.projectTemplateId)
        tmpl.projectTemplateUrl = tmplFile?.serverRelativeUrl
        return tmpl
      })

      let hasExistingTemplate = false
      let addedListContent = ''
      try {
        // Every field, not a select: a project set up before 1.13 can lack `GtProjectListContent`,
        // and SharePoint refuses a select of a column the list does not have.
        const [propertyItem] = await this.sp.web.lists
          .getByTitle(resource.Lists_ProjectProperties_Title)
          .items.top(1)()
        hasExistingTemplate = !!propertyItem && !stringIsNullOrEmpty(propertyItem.GtProjectTemplate)
        addedListContent = propertyItem?.GtProjectListContent ?? ''
      } catch {
        // List may not exist for new projects
      }

      return {
        ...data,
        extensions,
        contentConfig,
        templates,
        projectData,
        hasExistingTemplate,
        addedListContent,
        hasHubWriteAccess
      } as IProjectSetupData
    } catch (error) {
      throw new ProjectSetupError(
        '_fetchData',
        strings.GetSetupDataErrorMessage,
        strings.GetSetupDataErrorStack + error.message
      )
    }
  }

  /**
   * Check whether the current user can add items to the project list on the hub,
   * which the setup needs to register the project in the portfolio.
   *
   * @returns `undefined` when the check fails, so the setup writes to the hub as usual
   */
  private async _checkHubWriteAccess(): Promise<boolean | undefined> {
    try {
      return await this._portalDataService.currentUserHasPermissionsToList(
        'PROJECTS',
        PermissionKind.AddListItems
      )
    } catch (error) {
      Logger.write(
        `(ProjectSetup) Could not check write access to the hub project list: ${error?.message}`,
        LogLevel.Warning
      )
      return undefined
    }
  }

  /** Determines setup eligibility from site type, group membership, language and hub connection. */
  private async _validateProjectSetup(): Promise<ProjectSetupValidation> {
    const { isSiteAdmin, groupId, hubSiteId, siteId } = this.context.pageContext.legacyPageContext

    // `WebTemplate` returns the template name without its config number, so this
    // matches both `TEAMCHANNEL#0` (private) and `TEAMCHANNEL#1` (shared) channels.
    const { WebTemplate } = await this.sp.web.select('WebTemplate')()
    if (WebTemplate === 'TEAMCHANNEL') return ProjectSetupValidation.IsTeamChannel

    // Must precede the `groups/{groupId}/members` call below, which fails on a null id.
    if (!groupId) return ProjectSetupValidation.NoGroupId

    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })

    const members = await msgraph.Get<any[]>(`groups/${groupId}/members`)
    if (!members.some(({ mail }) => mail === this.context.pageContext.user.email)) {
      return ProjectSetupValidation.UserNotGroupMember
    }
    if (!isSiteAdmin) return ProjectSetupValidation.NotSiteAdmin
    if (!groupId) return ProjectSetupValidation.NoGroupId
    if (this.context.pageContext.web.language !== 1044) {
      const { Language } = await this._portalDataService.web.select('Language')()
      if (Language !== this.context.pageContext.web.language) {
        return ProjectSetupValidation.InvalidWebLanguage
      }
    }
    if (!hubSiteId) return ProjectSetupValidation.NoHubConnection
    if (siteId.includes(hubSiteId)) return ProjectSetupValidation.IsHubSite
    if (this._isSetup) return ProjectSetupValidation.AlreadySetup
    return ProjectSetupValidation.Ready
  }

  private _unmount(container: HTMLElement): void {
    unmountReact(container)
  }

  private get _container(): HTMLDivElement {
    const topPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top)
    return topPlaceholder.domElement
  }

  /** Reuses or creates a dialog mount point in the SharePoint top placeholder. */
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
   * Infers prior setup from a welcome page other than SharePoint's two default home pages.
   */
  private async _isProjectSetup() {
    try {
      const { WelcomePage } = await this.sp.web.rootFolder.select('WelcomePage')()
      return ['SitePages/CollabHome.aspx', 'SitePages/Home.aspx'].indexOf(WelcomePage) === -1
    } catch {
      return false
    }
  }

  /**
   * Disables multilingual features for site admins and reloads so setup uses the site's language.
   * A session flag allows the next run to record the operation in the hub log.
   */
  private async _removeAlternativeLanguages(): Promise<void> {
    try {
      if (!this.context.pageContext.legacyPageContext.isSiteAdmin) {
        Logger.write(
          '(ProjectSetup) User is not a site admin, skipping alternative language removal.',
          LogLevel.Info
        )
        return
      }

      const webInfo = await this.sp.web.select('Language', 'IsMultilingual')()

      Logger.write(
        `(ProjectSetup) Current language: ${webInfo.Language}, Is multilingual: ${webInfo.IsMultilingual}`,
        LogLevel.Info
      )

      if (!webInfo.IsMultilingual) {
        Logger.write(
          '(ProjectSetup) Site is not configured as multilingual, no alternative languages to remove.',
          LogLevel.Info
        )
        return
      }

      this._renderProgressDialog({
        progressIndicator: {
          label: strings.RemoveAlternativeLanguagesText,
          description: strings.RemoveAlternativeLanguagesProgressText
        },
        iconName: 'LocalLanguage',
        title: this.properties.progressDialogTitle,
        subText: this.properties.progressDialogSubText
      })

      Logger.write(
        '(ProjectSetup) Disabling multilingual features to remove alternative languages.',
        LogLevel.Info
      )

      await this.sp.web.update({ IsMultilingual: false })

      Logger.write(
        '(ProjectSetup) Successfully disabled multilingual features, alternative languages removed.',
        LogLevel.Info
      )

      const progressDialog = this._getPlaceholder('ProgressDialog')
      this._unmount(progressDialog)

      const languageRemovedKey = `pp_languagesRemoved_${this.context.pageContext.site.id.toString()}`
      sessionStorage.setItem(languageRemovedKey, 'true')

      Logger.write(
        '(ProjectSetup) Reloading page after language removal to apply changes.',
        LogLevel.Info
      )
      window.location.reload()
    } catch (error) {
      Logger.write(
        `(ProjectSetup) Failed to remove alternative languages: ${error.message}`,
        LogLevel.Warning
      )

      const progressDialog = this._getPlaceholder('ProgressDialog')
      this._unmount(progressDialog)
    }
  }

  /**
   * Returns the manifest version number, or 'Serving on localhost' if in debug mode.
   */
  private get version() {
    return DEBUG ? 'Serving on localhost' : `v${this.manifest.version}`
  }
}

export { IProjectSetupData }
