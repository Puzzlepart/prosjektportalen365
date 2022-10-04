import React, { FunctionComponent, useEffect, useState } from 'react'
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Spinner,
  SpinnerSize,
  format
} from 'office-ui-fabric-react'
import { SyncModalProps } from './types'
import SPDataAdapter from 'data'
import strings from 'ProjectWebPartsStrings'
import { TypedHash } from '@pnp/common'
import { sp } from '@pnp/sp'
import { Logger, LogLevel } from '@pnp/logging'

export const SyncProjectModal: FunctionComponent<SyncModalProps> = ({ isOpen, onDismiss, onSyncProperties, data, title, hubSite, context }) => {
  const [isLoading, setLoading] = useState(true)
  const [isSyncing, setSyncing] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)
  const [projectData, setProjectData] = useState({})
  const [projectDataId, setProjectDataId] = useState(0)

  useEffect(() => {
    getProjectData()
  }, [])

  return (
    <>
      <Dialog
        hidden={!isOpen}
        minWidth={400}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: strings.SynchronizeProjectDataTitle,
          subText: strings.SynchronizeProjectDataDescription,
        }}>
        {isLoading && <Spinner label={format(strings.LoadingText, strings.IdeaProjectDataTitle)} size={SpinnerSize.medium} />}
        {isSyncing && <Spinner label={strings.SyncProjectPropertiesValuesProgressLabel} size={SpinnerSize.medium} />}
        {!isLoading && !hasSynced && (
          <DialogFooter>
            <DefaultButton text={strings.CancelText} onClick={() => onDismiss()} disabled={isSyncing} />
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
              onClick={() => onDismiss()}
              disabled={isSyncing}
            />
          </DialogFooter>
        )}
      </Dialog>
    </>
  )

  async function updateIdeaProcessingItem(projectDataItemId: number) {
    try {
      const ideaProcessingList = hubSite.web.lists.getByTitle(strings.IdeaProcessingTitle)

      const [ideaProcessingItem] = await ideaProcessingList
        .items
        .filter(`GtIdeaProjectDataId eq '${projectDataItemId}'`)
        .select('Id')
        .get()

      const updatedResult = ideaProcessingList
        .items
        .getById(ideaProcessingItem.Id)
        .update({
          GtIdeaDecision: 'Godkjent og synkronisert'
        })

      return updatedResult
    } catch (error) {

    }
  }

  async function getProjectData() {
    try {
      const projectDataList = hubSite.web.lists
        .getByTitle(strings.IdeaProjectDataTitle)

      const [projectDataItem] = await projectDataList
        .items
        .filter(`GtSiteUrl eq '${context.pageContext.web.absoluteUrl}'`)
        .select('Id')
        .get()

      const item = projectDataList
        .items
        .getById(projectDataItem.Id)

      const [fieldValuesText, fieldValues] = await Promise.all([
        item.fieldValuesAsText.get(),
        item.get()
      ])

      const itemProperties = await SPDataAdapter.getMappedProjectProperties(
        fieldValues,
        { ...fieldValuesText, Title: title },
        data.templateParameters,
        true
      )

      setProjectData(itemProperties)
      setProjectDataId(projectDataItem.Id)
      setLoading(false)
    } catch (error) {
      throw error
    }
  }

  async function syncProperties(properties: TypedHash<any>, projectDataId: number) {
    setSyncing(true)

    const projectPropertiesList = sp.web.lists.getByTitle(strings.ProjectPropertiesListName)

    const [propertiesItem] = await projectPropertiesList
      .items
      .top(1)
      .select('Id')
      .get()

    // TODO: Implement sync of TaxonomyMultiProperties, as of now hidden note fields for the taxonomyMulti fields (ex: 'Prosjekttype_0')
    // does not exist in 'Prosjektegenskaper' list, therefore we can't find a internalName for the field to update
    // - Added a note in the dialog message regarding this.
    // Code example: projectPropertiesList.fields.getByTitle('Prosjekttype_0').get()

    try {
      projectPropertiesList
        .items
        .getById(propertiesItem.Id)
        .update(properties)

      await updateIdeaProcessingItem(projectDataId).then(() => {
        setSyncing(false)
        setHasSynced(true)
        onSyncProperties(true)
        onDismiss()
      })
    } catch (error) {
      Logger.log({
        message: `(onSyncProperties): Unable to sync properties from 'Prosjektdata' list: ${error.message}`,
        level: LogLevel.Info
      })
      throw error
    }
  }
}
