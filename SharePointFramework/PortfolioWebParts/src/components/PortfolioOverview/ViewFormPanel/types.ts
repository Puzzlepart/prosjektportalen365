import { IBasePanelProps, PortfolioOverviewView } from 'pp365-shared-library'

export interface IViewFormPanel extends Pick<IBasePanelProps, 'isOpen'> {
  view?: PortfolioOverviewView
}
