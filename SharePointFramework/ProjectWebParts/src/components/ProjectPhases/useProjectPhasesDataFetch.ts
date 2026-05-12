import { LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { UnknownAction } from '@reduxjs/toolkit'
import * as strings from 'ProjectWebPartsStrings'
import {
  ListLogger,
  ProjectAdminPermission,
  ProjectPhaseModel,
  DocumentTypeModel,
  errorWithCause
} from 'pp365-shared-library/lib/'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import {
  IArchiveDocumentItem,
  IArchiveItemHistory,
  IArchiveListItem,
  IArchiveStatusInfo
} from '../../data/SPDataAdapter/types'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { ProjectPhases } from './index'
import { INIT_DATA } from './reducer'
import { IPhaseSitePageModel, IProjectPhasesData, IProjectPhasesProps } from './types'
import { SPWeb } from '@microsoft/sp-page-context'
import resource from 'SharedResources'

/**
 * Finds project pages whose titles match configured phase names.
 */
export const getPhaseSitePages: DataFetchFunction<
  {
    phases: ProjectPhaseModel[]
    sp: SPFI
    web: SPWeb
  },
  IPhaseSitePageModel[]
> = async (params) => {
  try {
    const pages = (
      await params.sp.web
        .getList(`${params.web.serverRelativeUrl}/SitePages`)
        .items.select('Id', 'Title', 'FileLeafRef')()
    )
      .filter((p) => params.phases.some((phase) => phase.name === p.Title))
      .map<IPhaseSitePageModel>((p) => ({
        id: p.Id,
        title: p.Title,
        fileLeafRef: p.FileLeafRef
      }))
    return pages
  } catch (error) {
    throw error
  }
}

/**
 * Loads phases, checkpoints, change permissions and optional homepage and archive data.
 */
const fetchData: DataFetchFunction<IProjectPhasesProps, IProjectPhasesData> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      void SPDataAdapter.configure(props.spfxContext, {
        siteId: props.siteId,
        webUrl: props.webAbsoluteUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [phaseField, checklistData, welcomePage, properties] = await Promise.all([
      SPDataAdapter.getTermFieldContext('GtProjectPhase'),
      SPDataAdapter.project.getChecklistData(resource.Lists_PhaseChecklist_Title),
      SPDataAdapter.project.getWelcomePage(),
      SPDataAdapter.project.getProjectInformationData()
    ])
    const [phases, currentPhaseName, userHasChangePhasePermission] = await Promise.all([
      SPDataAdapter.project.getPhases(phaseField.termSetId, checklistData),
      SPDataAdapter.project.getCurrentPhaseName(phaseField.fieldName),
      SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.ChangePhase,
        properties.fieldValues
      )
    ])
    const phaseSitePages = props.useDynamicHomepage
      ? await getPhaseSitePages({ phases, sp: props.sp, web: props.pageContext?.web })
      : []

    let archiveDocuments: (IArchiveDocumentItem & { selected: boolean; disabled: any })[] = []
    let archiveLists: (IArchiveListItem & { selected: boolean })[] = []
    let documentTypes: DocumentTypeModel[] = []
    let archiveStatus: IArchiveStatusInfo | null = null
    let archiveHistory: Map<string, IArchiveItemHistory> = new Map()
    if (props.useArchive) {
      const [documents, lists, docTypes, archiveStatusData, archiveHistoryData] = await Promise.all(
        [
          SPDataAdapter.getDocumentsForArchive(),
          SPDataAdapter.getListsForArchive(),
          SPDataAdapter.getTermFieldContext('GtDocumentType').then((docTypeField) =>
            SPDataAdapter.project.getDocumentTypes(docTypeField.termSetId)
          ),
          SPDataAdapter.getArchiveStatus(props.webAbsoluteUrl),
          SPDataAdapter.getArchiveHistoryForItems(props.webAbsoluteUrl)
        ]
      )
      documentTypes = docTypes.filter((docType) => docType.isArchiveable)
      const docTypeNameById = new Map<string, string>(
        docTypes.map((t) => [t.id as string, t.name as string])
      )
      archiveDocuments = documents.map((doc) => ({
        ...doc,
        documentTypeName: docTypeNameById.get(doc?.documentTypeId),
        selected: false,
        disabled: !documentTypes.find((docType) => docType.id === doc?.documentTypeId)
      }))
      archiveLists = lists.map((list) => ({
        ...list,
        selected: false,
        disabled: list.itemCount === 0
      }))
      archiveStatus = archiveStatusData
      archiveHistory = archiveHistoryData
    }

    const [currentPhase] = phases.filter(({ name }) => name === currentPhaseName)
    return {
      currentPhase,
      phases,
      phaseField,
      phaseSitePages,
      welcomePage,
      userHasChangePhasePermission,
      ...(props.useArchive && {
        archiveDocuments,
        archiveLists,
        documentTypes,
        archiveStatus,
        archiveHistory
      })
    } as IProjectPhasesData
  } catch (error) {
    void ListLogger.log({
      message: (error as Error)?.message,
      level: 'Error',
      functionName: 'fetchData',
      component: ProjectPhases.displayName
    })
    // The cause lets the hook count the failure by the status SharePoint answered with.
    throw errorWithCause(strings.ProjectPhasesFetchDataError, error)
  }
}

/**
 * Loads phase selector data on mount and dispatches its result or failure. A fetch that fails
 * is counted for usage statistics, by its error code, and shown as before.
 */
export const useProjectPhasesDataFetch = (
  props: IProjectPhasesProps,
  dispatch: React.Dispatch<UnknownAction>
) => {
  const telemetry = useTelemetry()
  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA({ data })))
      .catch((error) => {
        telemetry.trackError(error)
        dispatch(INIT_DATA({ data: null, error }))
      })
  }, [])
}
