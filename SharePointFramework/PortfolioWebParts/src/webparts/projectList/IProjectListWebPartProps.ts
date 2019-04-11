
export interface IProjectListWebPartProps {
    phaseTermSetId: string;
    entity: {
        listName: string;
        contentTypeId: string;
        fieldsGroupName: string;
        identityFieldName: string;
    };
    sortBy?: string;
    showAsTiles?: boolean;
    showProjectOwner?: boolean;
    showProjectManager?: boolean;
}