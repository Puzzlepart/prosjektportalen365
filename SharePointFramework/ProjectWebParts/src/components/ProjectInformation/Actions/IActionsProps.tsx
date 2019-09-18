export interface IActionsProps {
    className: string;
    hidden: boolean;
    versionHistoryUrl: string;
    editFormUrl: string;
    onSyncPropertiesEnabled: boolean;
    onSyncProperties: () => void;
}
