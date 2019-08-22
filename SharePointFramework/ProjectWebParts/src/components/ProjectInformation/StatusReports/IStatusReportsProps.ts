import { ProjectStatusReport } from "models";

export interface IStatusReportsProps extends React.HTMLAttributes<HTMLElement> {
    statusReports?: ProjectStatusReport[];
    iconName?: string;
    reportLinkUrlTemplate?: string;
    webUrl: string;
}