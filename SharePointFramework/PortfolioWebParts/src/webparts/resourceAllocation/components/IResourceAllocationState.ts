import { ITimelineData } from 'prosjektportalen-spfx-shared/lib/interfaces/ITimelineData';
import * as moment from 'moment';

export interface IResourceAllocationState {
    isLoading: boolean;
    data?: ITimelineData<moment.Moment>;
    error?: string;
}