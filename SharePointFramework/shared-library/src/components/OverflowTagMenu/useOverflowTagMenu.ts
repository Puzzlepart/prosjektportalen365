import _ from 'underscore'
import { IOverflowTagMenuProps } from './types'

/**
 * Component logic hook for `OverflowTagMenu`
 */
export function useOverflowTagMenu(props: IOverflowTagMenuProps) {
  return {
    tags:
      !_.isEmpty(props.tags) &&
      props.tags.map((tag, idx) => {
        return {
          key: tag + idx,
          value: tag,
          primaryText: tag,
          children: tag,
          type: props.text
        }
      }),
    icon: props.icon
  } as const
}
