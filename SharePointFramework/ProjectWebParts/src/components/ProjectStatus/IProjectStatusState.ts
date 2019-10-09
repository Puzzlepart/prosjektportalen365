import { StatusReport } from 'shared/lib/models/StatusReport';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';
import { IProjectStatusData } from './IProjectStatusData';
import { IProjectStatusHashState } from './IProjectStatusHashState';

export interface IProjectStatusState extends IBaseWebPartComponentState<IProjectStatusData> {
    /**
     * Source URL
     */
    sourceUrl?: string;

    /**
     * Selected report
     */
    selectedReport?: StatusReport;

    /**
     * Hash state
     */
    hashState?: IProjectStatusHashState;
}