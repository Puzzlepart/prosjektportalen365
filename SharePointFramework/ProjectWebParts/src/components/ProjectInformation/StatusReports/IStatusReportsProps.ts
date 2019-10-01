import { StatusReport } from 'shared/lib/models/StatusReport';

export interface IStatusReportsProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * @todo Describe property
     */
    statusReports: StatusReport[];

    /**
     * @todo Describe property
     */
    iconName: string;

    /**
     * @todo Describe property
     */
    urlSourceParam?: string;
}