import { LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { AnyAction } from '@reduxjs/toolkit'
import * as strings from 'ProjectWebPartsStrings'
import {
  ListLogger,
  ProjectAdminPermission,
  ProjectPhaseModel,
  DocumentTypeModel
} from 'pp365-shared-library/lib/'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import {
  IArchiveDocumentItem,
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
 * Get phase site pages.
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
 * Fetch data for `ProjectPhases`.
 *
 * @param props Component properties for `ProjectPhases`
 */
const fetchData: DataFetchFunction<IProjectPhasesProps, IProjectPhasesData> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.spfxContext, {
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
    if (props.useArchive) {
      const [documents, lists, docTypes, archiveStatusData] = await Promise.all([
        SPDataAdapter.getDocumentsForArchive(),
        SPDataAdapter.getListsForArchive(),
        SPDataAdapter.getTermFieldContext('GtDocumentType').then((docTypeField) =>
          SPDataAdapter.project.getDocumentTypes(docTypeField.termSetId)
        ),
        SPDataAdapter.getArchiveStatus(props.webAbsoluteUrl)
      ])
      documentTypes = docTypes.filter((docType) => docType.isArchiveable)
      archiveDocuments = documents.map((doc) => ({
        ...doc,
        selected: false,
        disabled: !documentTypes.find((docType) => docType.id === doc?.documentTypeId)
      }))
      archiveLists = lists.map((list) => ({ ...list, selected: false }))
      archiveStatus = archiveStatusData
    }

    const [currentPhase] = phases.filter(({ name }) => name === currentPhaseName)
    return {
      currentPhase,
      phases,
      phaseField,
      phaseSitePages,
      welcomePage,
      userHasChangePhasePermission,
      ...(props.useArchive && { archiveDocuments, archiveLists, documentTypes, archiveStatus })
    } as IProjectPhasesData
  } catch (error) {
    ListLogger.log({
      message: error.message,
      level: 'Error',
      functionName: 'fetchData',
      component: ProjectPhases.displayName
    })
    throw new Error(strings.ProjectPhasesFetchDataError)
  }
}

/**
 * Fetch hook for `ProjectPhases`
 *
 * @param props Component properties for `ProjectPhases`
 * @param dispatch Dispatcer
 */
export const useProjectPhasesDataFetch = (
  props: IProjectPhasesProps,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA({ data })))
      .catch((error) => dispatch(INIT_DATA({ data: null, error })))
  }, [])
}
