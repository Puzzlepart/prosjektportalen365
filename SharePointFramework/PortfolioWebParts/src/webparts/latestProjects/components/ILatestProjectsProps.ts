import { DisplayMode } from '@microsoft/sp-core-library';
import { ILatestProjectsWebPartProps } from "../ILatestProjectsWebPartProps";

export interface ILatestProjectsProps extends ILatestProjectsWebPartProps {
  hubSiteId: string;
  displayMode: DisplayMode;
  updateProperty: (value: string) => void;
}
