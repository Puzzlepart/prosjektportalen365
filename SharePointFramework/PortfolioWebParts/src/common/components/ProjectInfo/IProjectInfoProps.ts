import ProjectListModel from "../../models/ProjectListModel";
import { PageContext } from "@microsoft/sp-page-context";

export interface IProjectInfoProps {
  project?: ProjectListModel;
  onDismiss: any;
  pageContext: PageContext;
  entity: {
    listName: string;
    contentTypeId: string;
    fieldsGroupName: string;
    siteIdFieldName: string;
  };
}
