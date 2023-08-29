/* eslint-disable prefer-spread */
import moment from 'moment'
import { useReducer } from 'react'
import { IProjectStatusContext } from './context'
import reducer, { initialState } from './reducer'
import { IProjectStatusProps } from './types'
import { useProjectStatusDataFetch } from './useProjectStatusDataFetch'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useProjectStatusDataFetch(props, dispatch)

  const context: IProjectStatusContext = { props, state, dispatch }

  const formattedDate = state.selectedReport
    ? moment(state.selectedReport.publishedDate ?? state.selectedReport.created).format(
        'DD.MM.YYYY'
      )
    : null

  const title = [props.title, formattedDate].join(' ')

  return { context, title }
}
