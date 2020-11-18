import { IPortfolioOverviewProps } from '../IPortfolioOverviewProps'
import { IPortfolioOverviewState } from '../IPortfolioOverviewState'
import { IFilterItemProps } from 'components/FilterPanel'
import { PortfolioOverviewView, ProjectColumn } from 'shared/lib/models'

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
