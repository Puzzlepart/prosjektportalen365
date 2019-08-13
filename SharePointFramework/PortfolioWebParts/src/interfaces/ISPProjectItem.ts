export interface ISPProjectItem {
    GtGroupId: string;
    GtSiteId: string;
    GtSiteUrl: string;
    GtProjectOwnerId: number;
    GtProjectManagerId: number;
    GtProjectPhase: {
        TermGuid: string;
    };
}
