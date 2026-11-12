import { Ref } from 'react'
import { IListProps } from '../types'

/** List-header options and the ref used to measure its sticky height. */
export interface IListHeaderProps extends IListProps {
  /**
   * The pinned command bar; `List` measures it to pin the column headers below it.
   */
  commandBarRef?: Ref<HTMLDivElement>
}
