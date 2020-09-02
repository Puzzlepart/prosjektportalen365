import { StatusReport } from 'shared/lib/models/StatusReport'

export interface IStatusReportsProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * Status reports
     */
    statusReports: StatusReport[];

    /**
     * Icon name
     */
    iconName: string;

    /**
     * URL source param
     */
    urlSourceParam?: string;
}