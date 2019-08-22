export interface IStatusReportsProps extends React.HTMLAttributes<HTMLElement> {
    statusReports?: { Id: number, Created: string }[];
    iconName?: string;
    reportLinkUrlTemplate?: string;
    webUrl: string;
}