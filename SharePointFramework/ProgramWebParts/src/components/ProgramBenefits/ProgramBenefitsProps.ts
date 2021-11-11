import { DataAdapter } from 'data'
import { IPortfolioConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'

export interface IProgramBenefitsProps {
  description: string;
  context: any;
  dataAdapter: DataAdapter;
  childProjects?: string[];
}
