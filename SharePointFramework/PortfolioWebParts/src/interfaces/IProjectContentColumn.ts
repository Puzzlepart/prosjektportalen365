import { IColumn } from "office-ui-fabric-react";

export interface IProjectContentColumn extends IColumn {
  internalName?: string
  sortOrder?: number
}
