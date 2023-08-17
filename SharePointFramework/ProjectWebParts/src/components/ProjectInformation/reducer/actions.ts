import { createAction } from '@reduxjs/toolkit'
import { IProjectInformationData } from 'pp365-shared-library'
import { CustomError } from 'pp365-shared-library/lib/models'
import { IProgressDialogProps } from '../ProgressDialog/types'
import {
    IProjectInformationState,
    ProjectInformationDialogType,
    ProjectInformationPanelType
} from '../types'

export const INIT_DATA = createAction<{
  state: Partial<IProjectInformationState>
  error?: CustomError
}>('INIT_DATA')
export const UPDATE_DATA = createAction<{ data: IProjectInformationData }>('UPDATE_DATA')
export const FETCH_DATA_ERROR = createAction<{ error: CustomError }>('FETCH_DATA_ERROR')
export const SET_PROGRESS = createAction<IProgressDialogProps>('SET_PROGRESS')
export const OPEN_PANEL = createAction<ProjectInformationPanelType>('OPEN_PANEL')
export const CLOSE_PANEL = createAction('CLOSE_PANEL')
export const OPEN_DIALOG = createAction<ProjectInformationDialogType>('OPEN_DIALOG')
export const CLOSE_DIALOG = createAction('CLOSE_DIALOG')
export const PROPERTIES_UPDATED = createAction<{ refetch: boolean }>('PROPERTIES_UPDATED')