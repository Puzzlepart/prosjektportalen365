export interface IStatusReportsProps extends React.HTMLAttributes<HTMLElement> {
    /**
     * @todo Describe property
     */
    statusReports: { Id: number, Created: string }[];

    /**
     * @todo Describe property
     */
    iconName: string;

    /**
     * @todo Describe property
     */
    urlTemplate: string;

    /**
     * @todo Describe property
     */
    urlSourceParam?: string;
}