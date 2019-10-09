import { StatusReport } from 'shared/lib/models/StatusReport';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';
import { IProjectStatusData } from './IProjectStatusData';
import { IProjectStatusHashState } from './IProjectStatusHashState';

export interface IProjectStatusState extends IBaseWebPartComponentState<IProjectStatusData> {
    /**
     * @todo describe property
     */
    newStatusCreated: boolean;

    /**
     * @todo describe property
     */
    showNewStatusReportModal?: boolean;

    /**
     * @todo describe property
     */
    sourceUrl?: string;

    /**
     * @todo describe property
     */
    selectedReport?: StatusReport;

    /**
     * @todo describe property
     */
    hashState?: IProjectStatusHashState;
}