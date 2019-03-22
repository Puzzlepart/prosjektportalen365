import { Web } from "@pnp/sp";
import { IProjectListWebPartProps } from "../ProjectListWebPart";

export interface IProjectListProps extends IProjectListWebPartProps {
  web: Web;
  siteId: string;
  siteAbsoluteUrl: string;
}
