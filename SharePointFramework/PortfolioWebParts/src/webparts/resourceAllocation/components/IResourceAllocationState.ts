import { ITimelineData } from "../../../common/interfaces/ITimelineData";

export interface IResourceAllocationState {
    isLoading: boolean;
    data?: ITimelineData;
    error?: string;
}