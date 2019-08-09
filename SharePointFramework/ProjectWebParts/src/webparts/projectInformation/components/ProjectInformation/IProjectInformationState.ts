import { IProjectInformationData } from "./IProjectInformationData";

export interface IProjectInformationState {
  isLoading: boolean;
  data?: IProjectInformationData;
  error?: any;
}
