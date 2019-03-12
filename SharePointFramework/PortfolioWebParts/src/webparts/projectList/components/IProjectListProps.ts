import { Web } from "@pnp/sp";
import { PageContext } from "@microsoft/sp-page-context";
import { SPHttpClient } from "@microsoft/sp-http";
import { IProjectListWebPartProps } from "../ProjectListWebPart";

export interface IProjectListProps extends IProjectListWebPartProps {
  webAbsoluteUrl: string;
  web: Web;
  webServerRelativeUrl: string;
  pageContext: PageContext;
  spHttpClient: SPHttpClient;
}
