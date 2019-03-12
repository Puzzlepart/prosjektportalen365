import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ILatestProjectsWebPartProps } from "../LatestProjectsWebPart";

export interface ILatestProjectsProps extends ILatestProjectsWebPartProps {
  absoluteUrl: string;
  serverRelativeUrl: string;
  context: WebPartContext;
  displayMode: DisplayMode;
  updateProperty: (value: string) => void;
}
