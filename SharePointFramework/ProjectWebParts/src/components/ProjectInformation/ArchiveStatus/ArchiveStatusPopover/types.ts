import { PopoverProps } from '@fluentui/react-components'
import { IArchiveStatusInfo, IArchiveOperation } from '../../../../data/SPDataAdapter/types'

export interface IArchiveStatusPopoverProps extends Omit<PopoverProps, 'children'> {
  /**
   * Archive status info
   */
  archiveInfo?: IArchiveStatusInfo

  /**
   * Processed operations with scope items
   */
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
