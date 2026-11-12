import { createAction } from '@reduxjs/toolkit'
import { IProjectInformationData } from 'pp365-shared-library'
import { CustomError } from 'pp365-shared-library/lib/models'
import { IProgressDialogProps } from '../ProgressDialog/types'
import {
  IProjectInformationState,
  ProjectInformationDialogType,
  ProjectInformationPanelType
} from '../types'

/** Initializes loaded project data and permissions. */
export const INIT_DATA = createAction<{
  state: Partial<IProjectInformationState>
  error?: CustomError
}>('INIT_DATA')
/** Refreshes project data and rebuilds its editable properties. */
export const UPDATE_DATA = createAction<{ data: IProjectInformationData }>('UPDATE_DATA')
/** Records a failure to load project information. */
export const FETCH_DATA_ERROR = createAction<{ error: CustomError }>('FETCH_DATA_ERROR')
/** Updates progress for a blocking operation. */
export const SET_PROGRESS = createAction<IProgressDialogProps>('SET_PROGRESS')
/** Opens a project information panel. */
export const OPEN_PANEL = createAction<ProjectInformationPanelType>('OPEN_PANEL')
/** Dismisses the active project information panel. */
export const CLOSE_PANEL = createAction('CLOSE_PANEL')
/** Opens a project setup dialog. */
export const OPEN_DIALOG = createAction<ProjectInformationDialogType>('OPEN_DIALOG')
/** Dismisses the active project setup dialog. */
export const CLOSE_DIALOG = createAction('CLOSE_DIALOG')
/** Completes a property save and optionally requests fresh data. */
export const PROPERTIES_UPDATED = createAction<{ refetch: boolean }>('PROPERTIES_UPDATED')
/** Sets or clears the warning from synchronizing properties to the hub. */
export const SET_HUB_SYNC_WARNING = createAction<string | null>('SET_HUB_SYNC_WARNING')
