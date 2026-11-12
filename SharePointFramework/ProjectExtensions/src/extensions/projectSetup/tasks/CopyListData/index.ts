import { stringIsNullOrEmpty } from '@pnp/core'
import { IProjectSetupData } from 'extensions/projectSetup'
import * as strings from 'ProjectExtensionsStrings'
import { SPField } from 'pp365-shared-library/lib/models/SPField'
import {
  BaseTask,
  BaseTaskError,
  IBaseTaskParams,
  captureEngineLog,
  engineLogLevel
} from '../@BaseTask'
import { ILogEntry, OnProgressCallbackFunction } from '../types'
import {
  ITaskDetails,
  PlannerConfiguration,
  TaskAttachment,
  TaskPreviewType
} from '../PlannerConfiguration'
import { TimelineConfiguration } from '../TimelineConfiguration'
import _ from 'underscore'
import { IWeb } from '@pnp/sp/webs'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/fields'
import '@pnp/sp/batching'
import { createBatch } from '@pnp/sp/batching'
import {
  CloudContentConfig,
  ContentConfig,
  ContentConfigType,
  IPackageDataRows,
  getAllItems,
  format
} from 'pp365-shared-library'
import { WebProvisioner } from 'sp-js-provisioning'
import { IPlannerTaskSPItem } from './types'

/**
 * The prefix of the engine's log lines from a cloud template's content, left out of the lines in
 * the advanced log.
 */
const CLOUD_LOG_PREFIX = '(ProjectSetup) (CopyListData) (Cloud)'

/** Provisions selected list, document, Planner and timeline content from hub or cloud sources. */
export class CopyListData extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('CopyListData', data)
  }

  /**
   * Ensures a default plan when needed and dispatches each selected content configuration by type.
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    super.initExecute(params, onProgress)
    try {
      await this.createDefaultPlannerPlan(params)
      for (let i = 0; i < this.data.selectedContentConfig.length; i++) {
        const contentConfig = this.data.selectedContentConfig[i]
        onProgress(contentConfig.text, contentConfig.text, 'Copy', {
          message: `Processing content config: ${contentConfig.text} (${contentConfig.type})`,
          level: 'info'
        })
        if (contentConfig instanceof CloudContentConfig) {
          if (contentConfig.type === ContentConfigType.Planner) {
            await this._applyCloudPlannerConfig(contentConfig, params, onProgress)
          } else {
            await this._applyCloudContentConfig(contentConfig, params)
          }
          continue
        }
        await contentConfig.load()

        switch (contentConfig.type) {
          case ContentConfigType.Planner:
            {
              const items = (
                await this._getSourceItems<IPlannerTaskSPItem>(contentConfig, [
                  'Title',
                  'GtDescription',
                  'GtCategory',
                  'GtSortOrder',
                  'GtChecklist',
                  'GtPlannerTags',
                  'GtAttachments',
                  'GtPlannerPreviewType'
                ])
              )
                // Configuration key order drives bucket and task creation order in Planner.
                .sort((a, b) =>
                  a.GtCategory === b.GtCategory
                    ? a.GtSortOrder - b.GtSortOrder
                    : (a.GtCategory ?? '').localeCompare(b.GtCategory ?? '')
                )

              const labels = _.uniq(
                _.flatten(
                  items.map((item) => {
                    if (!stringIsNullOrEmpty(item.GtPlannerTags)) {
                      return item.GtPlannerTags.split(';')
                    }
                  })
                )
              ).filter((label) => label)

              const configuration = this.parsePlannerConfiguration(items)
              await new PlannerConfiguration(
                contentConfig.plannerTitle,
                this.data,
                configuration,
                labels
              ).execute(params, onProgress)
            }
            break
          case ContentConfigType.Timeline:
            {
              await new TimelineConfiguration(this.data, contentConfig).execute(params, onProgress)
            }
            break
          case ContentConfigType.List:
            {
              if (contentConfig.sourceListProps.BaseTemplate === 101)
                await this._processFiles(contentConfig)
              else await this._processListItems(contentConfig)
            }
            break
        }
      }
      return params
    } catch (error) {
      throw new BaseTaskError(this.taskName, strings.CopyListDataErrorMessage, error)
    }
  }

  /**
   * Builds Planner configuration from bundled task rows without reading a hub list.
   */
  private async _applyCloudPlannerConfig(
    config: CloudContentConfig,
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<void> {
    const dataRows = await config.getCloudDataRows()
    const items = ((dataRows?.Rows ?? []) as IPlannerTaskSPItem[])
      // Package rows must produce the same Planner creation order as hub rows.
      .sort((a, b) =>
        a.GtCategory === b.GtCategory
          ? a.GtSortOrder - b.GtSortOrder
          : (a.GtCategory ?? '').localeCompare(b.GtCategory ?? '')
      )
    if (items.length === 0) {
      this.logInformation(`No bundled tasks for cloud Planner config ${config.text}`)
      return
    }
    const labels = _.uniq(
      _.flatten(
        items.map((item) => {
          if (!stringIsNullOrEmpty(item.GtPlannerTags)) {
            return item.GtPlannerTags.split(';')
          }
        })
      )
    ).filter((label) => label)
    const configuration = this.parsePlannerConfiguration(items)
    await new PlannerConfiguration(config.plannerTitle, this.data, configuration, labels).execute(
      params,
      onProgress
    )
  }

  /**
   * Applies bundled rows and folders to an existing project list, preserving its settings.
   * Engine diagnostics and unavailable matching columns are forwarded to the step log.
   */
  private async _applyCloudContentConfig(
    config: CloudContentConfig,
    params: IBaseTaskParams
  ): Promise<void> {
    const [dataRows, folders] = await Promise.all([
      config.getCloudDataRows(),
      config.getCloudFolders()
    ])
    const hasRows = (dataRows?.Rows?.length ?? 0) > 0
    const hasFolders = (folders?.length ?? 0) > 0
    if (!hasRows && !hasFolders) {
      this.logInformation(`No bundled rows or folders for cloud content config ${config.text}`)
      return
    }
    const countFolders = (items: Array<{ Folders?: any[] }>): number =>
      items.reduce((sum, folder) => sum + 1 + countFolders(folder.Folders ?? []), 0)
    const progressText = hasRows
      ? format(
          strings.CopyListItemsText,
          dataRows.Rows.length,
          config.sourceListTitle,
          config.destinationListTitle
        )
      : format(
          strings.CopyFilesText,
          countFolders(folders),
          config.sourceListTitle,
          config.destinationListTitle
        )
    const iconName = hasRows ? 'List' : 'Documentation'
    this.onProgress(progressText, '', iconName)
    // The engine updates an existing list with the settings the schema states: the destination's
    // own, so they stay as they are. It would create a missing list, so the step fails instead of
    // making a generic one.
    let destinationProps: {
      BaseTemplate?: number
      Description?: string
      ContentTypesEnabled?: boolean
    }
    try {
      destinationProps = await params.web.lists
        .getByTitle(config.destinationListTitle)
        .select('BaseTemplate', 'Description', 'ContentTypesEnabled')()
    } catch {
      throw new Error(
        format(
          strings.CloudContentConfigDestinationListMissing,
          config.destinationListTitle,
          config.sourceListTitle
        )
      )
    }
    const listSchema: Record<string, any> = {
      Title: config.destinationListTitle,
      Description: destinationProps.Description ?? '',
      Template:
        typeof destinationProps.BaseTemplate === 'number' ? destinationProps.BaseTemplate : 100,
      ContentTypesEnabled: !!destinationProps.ContentTypesEnabled
    }
    if (hasRows) {
      listSchema.DataRows = await this._getCloudDataRows(config, dataRows, params.web, (entry) =>
        this.onProgress(progressText, '', iconName, entry)
      )
    }
    if (hasFolders) {
      listSchema.Folders = folders
    }
    const schema = { Lists: [listSchema] }
    const provisioner = new WebProvisioner(params.web).setup({
      spfxContext: params.context,
      logging: { prefix: CLOUD_LOG_PREFIX, activeLogLevel: engineLogLevel() }
    } as any)
    await captureEngineLog(
      () => provisioner.applyTemplate(schema as any, null),
      (entry) => this.onProgress(progressText, '', iconName, entry),
      CLOUD_LOG_PREFIX
    )
  }

  /**
   * Projects bundled rows to configured fields while retaining a usable matching column.
   * If that column is missing, omit it and warn that repeated runs can add duplicates.
   */
  private async _getCloudDataRows(
    config: CloudContentConfig,
    dataRows: IPackageDataRows,
    web: IWeb,
    log: (entry: ILogEntry) => void
  ): Promise<IPackageDataRows> {
    const bundledKey = dataRows.KeyColumn ?? 'Title'
    const keyColumn = (await this._listHasColumn(web, config.destinationListTitle, bundledKey))
      ? bundledKey
      : undefined
    if (!keyColumn) {
      const message = format(
        strings.CloudContentConfigKeyColumnMissing,
        config.destinationListTitle,
        bundledKey
      )
      this.logWarning(message)
      log({ message, level: 'warning' })
    }
    // Without the KeyColumn in the projection every row was added again on each run.
    const fields =
      keyColumn && config.fields.length > 0 && !config.fields.includes(keyColumn)
        ? [...config.fields, keyColumn]
        : config.fields
    const rows = dataRows.Rows.map((row) => {
      const projected =
        fields.length === 0
          ? { ...row }
          : fields.reduce((values: Record<string, any>, fieldName) => {
              if (row[fieldName] !== undefined) values[fieldName] = row[fieldName]
              return values
            }, {})
      if (!keyColumn) delete projected[bundledKey]
      return projected
    })
    const result: IPackageDataRows = {
      UpdateBehavior: dataRows.UpdateBehavior ?? 'Overwrite',
      Rows: rows
    }
    if (keyColumn) result.KeyColumn = keyColumn
    return result
  }

  /**
   * Checks for a matching column, assuming it exists if metadata cannot be read.
   */
  private async _listHasColumn(web: IWeb, listTitle: string, columnName: string): Promise<boolean> {
    if (columnName === 'Title') return true
    try {
      // A queryable of its own: PnPjs 4's select sets the query on the queryable it is called on.
      const fields = await web.lists.getByTitle(listTitle).fields.select('InternalName')<
        Array<{ InternalName: string }>
      >()
      return fields.some((field) => field.InternalName === columnName)
    } catch (error) {
      this.logWarning(
        `Could not read the columns of list '${listTitle}' to check for '${columnName}', which the rows are matched by, so it is used: ${
          error?.message ?? error
        }`,
        { error }
      )
      return true
    }
  }

  /**
   * Groups source rows by category and task title, parsing checklist, label and attachment values.
   */
  private parsePlannerConfiguration(items: IPlannerTaskSPItem[]) {
    return items.reduce((obj, item) => {
      obj[item.GtCategory] = obj[item.GtCategory] || {}
      const taskDetails: ITaskDetails = {}
      taskDetails.previewType = 'automatic'
      if (!stringIsNullOrEmpty(item.Title)) {
        taskDetails.name = item.Title
      }
      if (!stringIsNullOrEmpty(item.GtDescription)) {
        taskDetails.description = item.GtDescription
      }
      if (!stringIsNullOrEmpty(item.GtChecklist)) {
        taskDetails.checklist = item.GtChecklist.replace(/\r?\n|\r/g, '').split(';')
      }
      if (!stringIsNullOrEmpty(item.GtPlannerTags)) {
        taskDetails.labels = item.GtPlannerTags.replace(/\r?\n|\r/g, '').split(';')
      }
      if (!stringIsNullOrEmpty(item.GtAttachments)) {
        try {
          taskDetails.attachments = item.GtAttachments.replace(/\r?\n|\r/g, '')
            .split('|')
            .map((str) => new TaskAttachment(str))
            .filter((attachment) => !stringIsNullOrEmpty(attachment.url))
        } catch (error) {}
      }
      if (!stringIsNullOrEmpty(item.GtPlannerPreviewType)) {
        let m: RegExpExecArray
        if ((m = /\(([^)]+)\)/.exec(item.GtPlannerPreviewType)) !== null) {
          taskDetails.previewType = (m[1] ?? 'automatic') as TaskPreviewType
        }
      }
      obj[item.GtCategory][item.Title] = taskDetails
      return obj
    }, {})
  }

  /**
   * Creates a default plan only when neither Planner content nor an existing group plan is available.
   */
  private async createDefaultPlannerPlan(params: IBaseTaskParams) {
    if (!_.any(this.data.selectedContentConfig, (c) => c.type === ContentConfigType.Planner)) {
      try {
        const plannerConfig = new PlannerConfiguration(null, this.data, {})
        const plans = await plannerConfig._fetchPlans(
          params.context.pageContext.legacyPageContext.groupId
        )
        if (_.isEmpty(plans)) {
          await plannerConfig.ensurePlan(
            {
              title: params.context.pageContext.web.title,
              owner: params.context.pageContext.legacyPageContext.groupId
            },
            params.context.pageContext,
            false
          )
        }
      } catch (error) {
        this.logWarning(
          `Failed to create default planner plan: ${error.statusCode ?? ''} ${
            error.message ?? error
          }`
        )
      }
    }
  }

  /**
   * Reads source rows with taxonomy labels, retrying without TaxCatchAll if unavailable.
   */
  private async _getSourceItems<T = any>(config: ContentConfig, fields?: string[]): Promise<T[]> {
    try {
      return await getAllItems<T>(
        config.sourceList.items
          .select(...(fields || config.fields), 'TaxCatchAll/ID', 'TaxCatchAll/Term')
          .expand('TaxCatchAll')
      )
    } catch (error) {
      try {
        return await getAllItems<T>(config.sourceList.items.select(...(fields || config.fields)))
      } catch (error) {
        return []
      }
    }
  }

  /** Reads source-field metadata needed to map taxonomy values. */
  private async _getSourceFields(config: ContentConfig): Promise<SPField[]> {
    try {
      return await config.sourceList.fields.select(...Object.keys(new SPField()))<SPField[]>()
    } catch (error) {
      return []
    }
  }

  /**
   * Copies mapped rows in bounded batches to limit throttling and report per-item failures.
   */
  private async _processListItems(config: ContentConfig, batchChunkSize = 25) {
    try {
      this.logInformation('Processing list items', { listConfig: config })
      const progressText = format(
        strings.CopyListItemsText,
        config.sourceListProps.ItemCount,
        config.sourceListProps.Title,
        config.destListProps.Title
      )
      this.onProgress(progressText, '', 'List')

      const [sourceItems, sourceFields] = await Promise.all([
        this._getSourceItems(config),
        this._getSourceFields(config)
      ])

      const itemsToAdd = sourceItems.map((itm) =>
        this._getProperties(config.fields, itm, sourceFields)
      )

      const list = config.destList
      const failed: Array<{ properties: Record<string, any>; error: any }> = []
      for (let i = 0, j = 0; i < itemsToAdd.length; i += batchChunkSize, j++) {
        const [batch, execute] = createBatch(list)
        const batchItems = itemsToAdd.slice(i, i + batchChunkSize)
        this.logInformation(`Processing batch ${j + 1} with ${batchItems.length} items`, {})
        this.onProgress(
          progressText,
          format(strings.ProcessListItemText, j + 1, batchItems.length),
          'List'
        )
        // Keep the per-item promises: a rejected add (e.g. a property the
        // destination list lacks) must be reported, not become an unhandled
        // rejection while the task reports success.
        const adds = batchItems.map((properties) =>
          list.items
            .using(batch)
            .add(properties)
            .then(() => null)
            .catch((error) => ({ properties, error }))
        )
        await execute()
        const batchFailures = (await Promise.all(adds)).filter(Boolean)
        // In the step's log too, which ends the setup with a warning: the step goes on past them.
        for (const failure of batchFailures) {
          const message = `Failed to add item '${failure.properties?.Title ?? ''}' to list '${
            config.destListProps.Title
          }': ${failure.error?.message ?? failure.error}`
          this.logError(message, { properties: failure.properties, error: failure.error })
          this.onProgress(progressText, '', 'List', { message, level: 'error' })
        }
        failed.push(...batchFailures)
      }
      if (failed.length > 0) {
        const message = `${failed.length} of ${itemsToAdd.length} item(s) could not be copied from '${config.sourceListProps.Title}' to '${config.destListProps.Title}'`
        this.logWarning(message, {
          failedItems: failed.map((failure) => failure.properties?.Title)
        })
        this.onProgress(progressText, '', 'List', { message, level: 'warning' })
        if (failed.length === itemsToAdd.length) {
          throw new Error(
            `None of the ${itemsToAdd.length} item(s) could be copied to list '${
              config.destListProps.Title
            }': ${failed[0].error?.message ?? failed[0].error}`
          )
        }
      }
    } catch (error) {
      throw error
    }
  }

  /** Attaches downloaded blobs to source-file metadata before copying. */
  private async _getFileContents(web: IWeb, files: any[]): Promise<any[]> {
    try {
      const fileContents = await Promise.all(
        files.map(async (file) => {
          file.Blob = await web.getFileByServerRelativePath(file.FileRef).getBlob()
          return file
        })
      )
      return fileContents
    } catch (error) {
      throw error
    }
  }

  /** Recreates source folders sequentially beneath the destination library root. */
  private async _provisionFolderHierarchy(
    config: ContentConfig,
    folders: string[],
    progressText: string
  ): Promise<void> {
    try {
      await folders.sort().reduce((chain: Promise<any>, folder, index: number) => {
        const folderServerRelUrl = `${
          config.destListProps.RootFolder.ServerRelativeUrl
        }/${folder.replace(config.sourceListProps.RootFolder.ServerRelativeUrl, '')}`
        this.onProgress(
          progressText,
          format(strings.ProcessFolderText, index + 1, folders.length),
          'Documentation'
        )
        return chain.then(() =>
          this.params.web
            .getFolderByServerRelativePath(config.destListProps.RootFolder.ServerRelativeUrl)
            .folders.addUsingPath(folderServerRelUrl, true)
        )
      }, Promise.resolve())
      return
    } catch (error) {
      throw error
    }
  }

  /** Copies library folders and files, overwriting existing files and continuing past failed uploads. */
  private async _processFiles(config: ContentConfig) {
    try {
      this.logInformation('Processing files and folders', { listConfig: config })
      const progressText = format(
        strings.CopyFilesText,
        config.sourceListProps.ItemCount,
        config.sourceListProps.Title,
        config.destListProps.Title
      )
      this.onProgress(progressText, '', 'Documentation')

      const spItems = await getAllItems(
        config.sourceList.items
          .expand('Folder')
          .select('Title', 'LinkFilename', 'FileRef', 'FileDirRef', 'Folder/ServerRelativeUrl')
      )

      const folders: string[] = []
      const files: any[] = []

      spItems.forEach((item) => {
        if (item.Folder?.ServerRelativeUrl) folders.push(item.Folder.ServerRelativeUrl)
        else files.push(item)
      })

      await this._provisionFolderHierarchy(config, folders, progressText)

      const filesWithContents = await this._getFileContents(config.web, files)
      const filesCopied = []
      for (let i = 0; i < filesWithContents.length; i++) {
        const file = filesWithContents[i]
        const destFolderUrl = `${
          config.destListProps.RootFolder.ServerRelativeUrl
        }${file.FileDirRef.replace(config.sourceListProps.RootFolder.ServerRelativeUrl, '')}`
        try {
          this.logInformation(`Copying file ${file.LinkFilename}`)
          this.onProgress(
            progressText,
            format(strings.ProcessFileText, i + 1, files.length),
            'Documentation'
          )
          const filename = file.LinkFilename
          const fileInfo = await this.params.web
            .getFolderByServerRelativePath(destFolderUrl)
            .files.addUsingPath(filename, file.Blob, { Overwrite: true })
          filesCopied.push(fileInfo)
          this.logInformation(`Successfully copied file ${file.LinkFilename}`)
        } catch (err) {}
      }
      return filesCopied
    } catch (error) {
      throw error
    }
  }

  /**
   * Maps configured source values to destination properties, serializing taxonomy via hidden fields.
   * Single-value taxonomy text-field names are truncated to SharePoint's 32-character limit.
   */
  private _getProperties(
    fields: string[],
    sourceItem: Record<string, any>,
    sourceFields: SPField[]
  ) {
    return fields.reduce((obj: Record<string, any>, fieldName: string) => {
      const fieldValue = sourceItem[fieldName]
      if (fieldValue) {
        const [field] = sourceFields.filter((fld) => fld.InternalName === fieldName)
        if (field) {
          switch (field.TypeAsString) {
            case 'TaxonomyFieldType':
              {
                const [textField] = sourceFields.filter((fld) => fld.Id === field.TextField)
                if (textField) {
                  const [taxonomyFieldValue] = (sourceItem.TaxCatchAll || []).filter(
                    (tax: any) => tax.ID === fieldValue.WssId
                  )
                  if (taxonomyFieldValue) {
                    const textFieldName = textField.InternalName.substring(0, 32)
                    obj[textFieldName] = `-1;#${taxonomyFieldValue.Term}|${fieldValue.TermGuid}`
                  }
                }
              }
              break
            case 'TaxonomyFieldTypeMulti':
              {
                const [textField] = sourceFields.filter((fld) => fld.Id === field.TextField)
                if (textField && Array.isArray(fieldValue)) {
                  const taxonomyValues = fieldValue
                    .map((taxValue: any) => {
                      const [taxonomyFieldValue] = (sourceItem.TaxCatchAll || []).filter(
                        (tax: any) => tax.ID === taxValue.WssId
                      )
                      if (taxonomyFieldValue) {
                        return `-1;#${taxonomyFieldValue.Term}|${taxValue.TermGuid}`
                      }
                      return null
                    })
                    .filter((v) => v !== null)

                  if (taxonomyValues.length > 0) {
                    const textFieldName = textField.InternalName
                    obj[textFieldName] = taxonomyValues.join(';#')
                  }
                }
              }
              break
            default: {
              obj[fieldName] = fieldValue
            }
          }
        }
      }
      return obj
    }, {})
  }
}
