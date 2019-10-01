import { ProjectStatusReport } from 'models';
import { IProjectStatusData } from './IProjectStatusData';
import { IBaseWebPartComponentState } from '../BaseWebPartComponent';
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
    selectedReport?: ProjectStatusReport;

    /**
     * @todo describe property
     */
    hashState?: IProjectStatusHashState;
}