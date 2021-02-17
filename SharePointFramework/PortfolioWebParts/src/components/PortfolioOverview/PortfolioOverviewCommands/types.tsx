import { IFilterItemProps } from 'components/FilterPanel'
import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { IPortfolioOverviewProps, IPortfolioOverviewState } from '../types'

export interface IPortfolioOverviewCommandsEvents {
  onSetCompact: (isCompact: boolean) => void
  onChangeView: (view: PortfolioOverviewView) => void
  onFilterChange: (column: ProjectColumn, selectedItems: IFilterItemProps[]) => void
}

export interface IPortfolioOverviewCommandsProps
  extends Partial<IPortfolioOverviewProps>,
    Partial<IPortfolioOverviewState>,
    React.HTMLProps<HTMLDivElement> {
  fltItems: any[]
  fltColumns: ProjectColumn[]
  events: IPortfolioOverviewCommandsEvents
  layerHostId: string
}

export interface IPortfolioOverviewCommandsState {
  showFilterPanel: boolean
  isExporting?: boolean
}
