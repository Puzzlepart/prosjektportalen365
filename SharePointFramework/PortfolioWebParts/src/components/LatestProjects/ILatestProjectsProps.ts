import { DisplayMode } from '@microsoft/sp-core-library';

export interface ILatestProjectsProps {
  title: string;
  rowLimit: number;
  hubSiteId: string;
  displayMode: DisplayMode;
  updateProperty: (value: string) => void;
}
