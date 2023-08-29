import moment from 'moment'
import { useProjectStatusContext } from '../context'

/**
 * Hook that returns the header title for the project status web part.
 *
 * @returns An object containing the header title.
 */
export function useHeader() {
  const context = useProjectStatusContext()
  const formattedDate = context.state.selectedReport
    ? moment(
        context.state.selectedReport.publishedDate ?? context.state.selectedReport.created
      ).format('DD.MM.YYYY')
    : null

  const title = [context.props.title, formattedDate].join(' ')

  return { title }
}
