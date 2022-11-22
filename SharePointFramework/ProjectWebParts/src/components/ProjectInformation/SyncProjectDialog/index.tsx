import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  format,
  PrimaryButton,
  Spinner,
  SpinnerSize
} from '@fluentui/react'
import { TypedHash } from '@pnp/common'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useEffect, useState } from 'react'
import SPDataAdapter from '../../../data'
import { ProjectInformationContext } from '../context'

export const SyncProjectDialog: FC = () => {
  const context = useContext(ProjectInformationContext)
  const [isLoading, setLoading] = useState(true)
  const [isSyncing, setSyncing] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)
  const [projectData, setProjectData] = useState({})
  const [projectDataId, setProjectDataId] = useState(0)

  useEffect(() => {
    getProjectData()
  }, [])

  return (
    <Dialog
      hidden={!context.state.displaySyncProjectDialog}
      minWidth={400}
      onDismiss={() => context.setState({ displaySyncProjectDialog: false })}
      dialogContentProps={{
        type: DialogType.largeHeader,
        title: strings.SyncProjectModalTitle,
        subText: strings.SyncProjectModalSubText
      }}>
      {isLoading && (
        <Spinner
          label={format(strings.LoadingText, strings.IdeaProjectDataTitle)}
          size={SpinnerSize.medium}
        />
      )}
      {isSyncing && (
        <Spinner
          label={strings.SyncProjectPropertiesValuesProgressLabel}
          size={SpinnerSize.medium}
        />
      )}
      {!isLoading && !hasSynced && (
        <DialogFooter>
          <DefaultButton
            text={strings.CancelText}
            onClick={() => context.setState({ displaySyncProjectDialog: false })}
            disabled={isSyncing}
          />
          <PrimaryButton
            text='Synkroniser'
            onClick={() => {
              syncProperties(projectData, projectDataId)
            }}
            disabled={isSyncing}
          />
        </DialogFooter>
      )}
      {hasSynced && (
        <DialogFooter>
          <PrimaryButton
            text={strings.CloseText}
            onClick={() => context.setState({ displaySyncProjectDialog: false })}
            disabled={isSyncing}
          />
        </DialogFooter>
      )}
    </Dialog>
  )

  async function updateIdeaProcessingItem(projectDataItemId: number) {
    try {
      const ideaProcessingList = context.props.hubSiteContext.web.lists.getByTitle(
        strings.IdeaProcessingTitle
      )

      const [ideaProcessingItem] = await ideaProcessingList.items
        .filter(`GtIdeaProjectDataId eq '${projectDataItemId}'`)
        .select('Id')()

      const updatedResult = await ideaProcessingList.items.getById(ideaProcessingItem.Id).update({
        GtIdeaDecision: 'Godkjent og synkronisert'
      })

      return updatedResult
    } catch (error) {}
  }

  async function getProjectData() {
    try {
      const projectDataList = context.props.hubSiteContext.web.lists.getByTitle(
        strings.IdeaProjectDataTitle
      )

      const [projectDataItem] = await projectDataList.items
        .filter(`GtSiteUrl eq '${context.props.spfxContext.pageContext.web.absoluteUrl}'`)
        .select('Id')()

      const item = projectDataList.items.getById(projectDataItem.Id)

      const [fieldValuesText, fieldValues] = await Promise.all([
        item.fieldValuesAsText(),
        item()
      ])

      const itemProperties = await SPDataAdapter.getMappedProjectProperties(
        fieldValues,
        { ...fieldValuesText, Title: context.props.spfxContext.pageContext.web.title },
        context.state.data.templateParameters,
        true
      )
      setProjectData(itemProperties)
      setProjectDataId(projectDataItem.Id)
      setLoading(false)
    } catch (error) {
      throw error
    }
  }

  /**
   * TODO: Implement sync of TaxonomyMultiProperties, as of now hidden note fields for the taxonomyMulti fields (ex: 'Prosjekttype_0')
   * does not exist in 'Prosjektegenskaper' list, therefore we can't find a internalName for the field to update
   *
   * - Added a note in the dialog message regarding this.
   *
   * **Code example:**
   *
   * `projectPropertiesList.fields.getByTitle('Prosjekttype_0').get()`
   *
   * @param properties Properties
   * @param projectDataId Project data ID
   */
  async function syncProperties(properties: TypedHash<any>, projectDataId: number) {
    setSyncing(true)

    const projectPropertiesList = context.props.sp.web.lists.getByTitle(strings.ProjectPropertiesListName)

    const [propertiesItem] = await projectPropertiesList.items.top(1).select('Id')()

    try {
      projectPropertiesList.items.getById(propertiesItem.Id).update(properties)

      await updateIdeaProcessingItem(projectDataId).then(() => {
        setSyncing(false)
        setHasSynced(true)
        context.setState({ displaySyncProjectDialog: false })
        context.onSyncProperties(true)
      })
    } catch (error) {
      throw error
    }
  }
}
