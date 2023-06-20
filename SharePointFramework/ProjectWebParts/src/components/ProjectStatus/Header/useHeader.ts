import moment from 'moment'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

/**
 * Component logic hook for the `Header` component
 */
export function useHeader() {
  const context = useContext(ProjectStatusContext)
  const formattedDate = context.state.selectedReport
    ? moment(
        context.state.selectedReport.publishedDate ??
          context.state.selectedReport.created
      ).format('DD.MM.YYYY')
    : null
  return {
    isDataLoaded: context.state.isDataLoaded,
    title: [context.props.title, formattedDate].join(' ')
  } as const
}
