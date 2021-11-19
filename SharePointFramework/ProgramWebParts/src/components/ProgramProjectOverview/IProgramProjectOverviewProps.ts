import { DataAdapter } from 'data'
import { IPortfolioConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'

export interface IProjectProgramOverviewProps {
  webPartTitle: string;
  context: any;
  configuration: IPortfolioConfiguration;
  dataAdapter: DataAdapter;
  childProjects?: string[];
}
