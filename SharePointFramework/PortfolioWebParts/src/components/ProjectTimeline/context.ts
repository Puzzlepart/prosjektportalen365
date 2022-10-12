import { IFilterItemProps } from 'components/FilterPanel/FilterItem/types'
import { IColumn } from 'office-ui-fabric-react/lib/components/DetailsList'
import React from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'

export interface IProjectTimelineContext {
  props: IProjectTimelineProps
  state: IProjectTimelineState
  setState: (newState: Partial<IProjectTimelineState>) => void
  onFilterChange: (column: IColumn, selectedItems: IFilterItemProps[]) => void
  onGroupChange: (group: string) => void
}

export const ProjectTimelineContext = React.createContext<IProjectTimelineContext>(null)
