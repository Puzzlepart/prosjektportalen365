import { useMemo } from 'react'
import { getStatusMark } from '../../util/statusMark'
import { IStatusMarkProps } from './types'

const MIN_MARK_SIZE = 12

/**
 * Component logic hook for `StatusMark`: the mark's shape and colour, and its size beside the
 * icon. `mark` is `null` when the status has no shape to show.
 *
 * @param props Props for the component
 */
export function useStatusMark(props: IStatusMarkProps) {
  const mark = useMemo(
    () => getStatusMark(props.color, props.iconName),
    [props.color, props.iconName]
  )
  const size = Math.max(MIN_MARK_SIZE, Math.round((props.iconSize ?? 0) * 0.4))
  return { mark, size } as const
}
