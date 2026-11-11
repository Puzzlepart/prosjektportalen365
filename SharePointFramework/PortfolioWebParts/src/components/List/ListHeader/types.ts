import { Ref } from 'react'
import { IListProps } from '../types'

export interface IListHeaderProps extends IListProps {
  /**
   * The pinned command bar; `List` measures it to pin the column headers below it.
   */
  commandBarRef?: Ref<HTMLDivElement>
}
