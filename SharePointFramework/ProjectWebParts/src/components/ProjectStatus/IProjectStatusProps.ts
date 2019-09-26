export interface IProjectStatusProps {
    /**
     * Title of the web part
     */
    title: string;

    /**
     * ID of the site
     */
    siteId: string;

    /**
     * URL for the web
     */
    webUrl: string;

    /**
     * Title for the web
     */
    webTitle: string;

    /**
     * Email for the current user
     */
    currentUserEmail: string;

    /**
     * URL for the hub site
     */
    hubSiteUrl: string;

    /**
     * List name for reports
     */
    reportListName: string;

    /**
     * List name for sections
     */
    sectionsListName: string;

    /**
     * Content type id for report
     */
    reportCtId: string;
}
