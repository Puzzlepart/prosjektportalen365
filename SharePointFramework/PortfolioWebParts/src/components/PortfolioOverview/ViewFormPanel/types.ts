import { IPanelProps } from '@fluentui/react'
import { PortfolioOverviewView } from 'pp365-shared-library'

export interface IViewFormPanel extends Pick<IPanelProps, 'isOpen'> {
  view?: PortfolioOverviewView
}
