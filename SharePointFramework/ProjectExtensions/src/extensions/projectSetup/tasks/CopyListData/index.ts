import { stringIsNullOrEmpty } from '@pnp/core'
import { IProjectSetupData } from 'extensions/projectSetup'
import { format } from '@fluentui/react/lib/Utilities'
import * as strings from 'ProjectExtensionsStrings'
import { SPField } from 'pp365-shared-library/lib/models/SPField'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import {
  ITaskDetails,
  PlannerConfiguration,
  TaskAttachment,
  TaskPreviewType
} from '../PlannerConfiguration'
import { TimelineConfiguration } from '../TimelineConfiguration'
import _ from 'underscore'
import { IWeb } from '@pnp/sp/webs'
import '@pnp/sp/items/get-all'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/batching'
import { createBatch } from '@pnp/sp/batching'
import { CloudContentConfig, ContentConfig, ContentConfigType } from 'pp365-shared-library'
import { LogLevel } from '@pnp/logging'
import { WebProvisioner } from 'sp-js-provisioning'
import { IPlannerTaskSPItem } from './types'

export class CopyListData extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('CopyListData', data)
  }

  /**
   * Execute `CopyListData`.
   *
   * Creates a Planner plan for the Microsoft 365 group, then loops
   * through all list data configurations. For each configuration,
   * it will either create a Planner plan or copy list items based
   * on the configuration type.
   *
   * If there's no Planner configuration, it will create a default
   * one.
   *
   * @param params Task parameters
   * @param onProgress On progress function
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
        // Cloud template content: rows come from the .pppkg, not a hub list.
        if (contentConfig instanceof CloudContentConfig) {
          await this._applyCloudContentConfig(contentConfig, params)
          continue
        }
        await contentConfig.load()
        // eslint-disable-next-line default-case
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
                // Group by category, then ascending GtSortOrder within each category.
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
   * Apply a **cloud template** list-content config: read the bundled
   * rows from the `.pppkg`, project them to the config's `fields` subset, and
   * write them into the project's destination list via the sp-js-provisioning
   * `DataRows` handler (run on the project web, after `SetTaxonomyFields` so the
   * `GtProjectPhase` term field is already bound). Nothing is read from the hub.
   *
   * @param config Cloud content config
   * @param params Task parameters
   */
  private async _applyCloudContentConfig(
    config: CloudContentConfig,
    params: IBaseTaskParams
  ): Promise<void> {
    const dataRows = await config.getCloudDataRows()
    if (!dataRows?.Rows?.length) {
      this.logInformation(`No bundled rows for cloud content config ${config.text}`)
      return
    }
    const fields = config.fields
    const rows = dataRows.Rows.map((row) => {
      if (fields.length === 0) return row
      return fields.reduce((projected: Record<string, any>, fieldName) => {
        if (row[fieldName] !== undefined) projected[fieldName] = row[fieldName]
        return projected
      }, {})
    })
    this.onProgress(
      format(
        strings.CopyListItemsText,
        rows.length,
        config.sourceListTitle,
        config.destinationListTitle
      ),
      '',
      'List'
    )
    // Match the destination list's actual base template (e.g. 100 custom list,
    // 101 document library) so the DataRows handler doesn't mismatch an existing
    // library/list. The list already exists (created by the template); fall back
    // to 100 only if it can't be read.
    let destinationTemplate = 100
    try {
      const destinationProps = (await params.web.lists
        .getByTitle(config.destinationListTitle)
        .select('BaseTemplate')()) as { BaseTemplate?: number }
      if (typeof destinationProps?.BaseTemplate === 'number')
        destinationTemplate = destinationProps.BaseTemplate
    } catch {
      // Destination list not found / unreadable — keep the generic-list default.
    }
    const schema = {
      Lists: [
        {
          Title: config.destinationListTitle,
          Description: '',
          Template: destinationTemplate,
          ContentTypesEnabled: false,
          DataRows: {
            KeyColumn: dataRows.KeyColumn ?? 'Title',
            UpdateBehavior: dataRows.UpdateBehavior ?? 'Overwrite',
            Rows: rows
          }
        }
      ]
    }
    const provisioner = new WebProvisioner(params.web).setup({
      spfxContext: params.context,
      logging: { prefix: '(ProjectSetup) (CopyListData) (Cloud)', activeLogLevel: LogLevel.Info }
    } as any)
    await provisioner.applyTemplate(schema as any, null)
  }

  /**
   * Parses Planner configuration from Planner task items.
   *
   * @param items Planner task items
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
   * Creates a default Planner plan if there's no Planner configuration. This
   * makes sure we have a Planner web part that doesn't throw errors.
   *
   * When upgrading to a parent project, this method will skip creating a new
   * default plan if the group already has existing plans to preserve them.
   *
   * @param params Task parameters
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
   * Get all items from the `config.sourceList`. First it will try to get
   * all items with the `TaxCatchAll` field, if that fails it will try to
   * get all items without the `TaxCatchAll` field.
   *
   * @param config List content config
   * @param fields Fields
   */
  private async _getSourceItems<T = any>(config: ContentConfig, fields?: string[]): Promise<T[]> {
    try {
      return await config.sourceList.items
        .select(...(fields || config.fields), 'TaxCatchAll/ID', 'TaxCatchAll/Term')
        .expand('TaxCatchAll')
        .getAll()
    } catch (error) {
      try {
        return await config.sourceList.items.select(...(fields || config.fields)).getAll()
      } catch (error) {
        return []
      }
    }
  }

  /**
   * Get fields from the `config.sourceList` list.
   *
   * @param config Content config
   */
  private async _getSourceFields(config: ContentConfig): Promise<SPField[]> {
    try {
      return await config.sourceList.fields.select(...Object.keys(new SPField()))<SPField[]>()
    } catch (error) {
      return []
    }
  }

  /**
   * Process list items in batches the size of the `batchChunkSize` parameter.
   * This is to prevent throttling, and to increase performance.
   *
   * @param config Content config
   * @param batchChunkSize Batch chunk size (defaults to `25`)
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
      for (let i = 0, j = 0; i < itemsToAdd.length; i += batchChunkSize, j++) {
        const [batch, execute] = createBatch(list)
        const batchItems = itemsToAdd.slice(i, i + batchChunkSize)
        this.logInformation(`Processing batch ${j + 1} with ${batchItems.length} items`, {})
        this.onProgress(
          progressText,
          format(strings.ProcessListItemText, j + 1, batchItems.length),
          'List'
        )
        batchItems.forEach((properties) => list.items.using(batch).add(properties))
        await execute()
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get file contents for the specified files.
   *
   * @param web Web
   * @param files Files to get content for
   */
  private async _getFileContents(web: IWeb, files: any[]): Promise<any[]> {
    try {
      const fileContents = await Promise.all(
        files.map(
          (file) =>
            new Promise<any>(async (resolve) => {
              const blob = await web.getFileByServerRelativePath(file.FileRef).getBlob()
              file.Blob = blob
              resolve(file)
            })
        )
      )
      return fileContents
    } catch (error) {
      throw error
    }
  }

  /**
   * Create folder hierarchy
   *
   * @param config Content config
   * @param folders An array of folders to provision
   * @param progressText Progress text
   */
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

  /**
   * Process files in the source library inlcuding files and folders and copy them to the destination list.
   *
   * @param config Content config
   */
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

      const spItems = await config.sourceList.items
        .expand('Folder')
        .select('Title', 'LinkFilename', 'FileRef', 'FileDirRef', 'Folder/ServerRelativeUrl')
        .getAll()

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
          const fileAddResult = await this.params.web
            .getFolderByServerRelativePath(destFolderUrl)
            .files.addUsingPath(filename, file.Blob, { Overwrite: true })
          filesCopied.push(fileAddResult)
          this.logInformation(`Successfully copied file ${file.LinkFilename}`)
        } catch (err) {}
      }
      return filesCopied
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item properties from the source items. This is used to create the destination items
   * with the properties specified in the config list. For the taxonomy fields, the text field
   * name for the term is also retrieved and added to the destination item. The term field is
   * storing internal names longer than 32 characters, which is not allowed for field names so
   * we need to substring the name to 32 characters.
   *
   * @param fields Fields
   * @param sourceItem Source item
   * @param sourceFields Source fields
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
