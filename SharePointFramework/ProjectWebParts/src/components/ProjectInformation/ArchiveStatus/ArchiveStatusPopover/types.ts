import { PopoverProps } from '@fluentui/react-components'
import { IArchiveStatusInfo, IArchiveOperation } from '../../../../data/SPDataAdapter/types'

/** Archive summary and processed operations shown in the popover. */
export interface IArchiveStatusPopoverProps extends Omit<PopoverProps, 'children'> {
  archiveInfo?: IArchiveStatusInfo

  operations?: Array<
    IArchiveOperation & {
      scopeItems: Array<{
        scope: string
        count: number
        status: string
        icon: JSX.Element
        color: string
      }>
    }
  >
}
