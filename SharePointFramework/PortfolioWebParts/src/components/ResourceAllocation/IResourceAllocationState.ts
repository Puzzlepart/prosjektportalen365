import { ITimelineData } from 'interfaces';

export interface IResourceAllocationState {
    isLoading: boolean;
    showFilterPanel: boolean;
    activeFilters: {[key: string]: string[] };
    data?: ITimelineData;
    error?: string;
}