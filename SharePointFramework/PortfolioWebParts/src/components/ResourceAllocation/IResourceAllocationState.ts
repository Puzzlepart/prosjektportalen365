import { ITimelineData } from 'interfaces';

export interface IResourceAllocationState {
    /**
     * @todo describe property
     */
    isLoading: boolean;

    /**
     * @todo describe property
     */
    showFilterPanel: boolean;

    /**
     * @todo describe property
     */
    activeFilters: {[key: string]: string[] };

    /**
     * @todo describe property
     */
    data?: ITimelineData;

    /**
     * @todo describe property
     */
    error?: string;
}