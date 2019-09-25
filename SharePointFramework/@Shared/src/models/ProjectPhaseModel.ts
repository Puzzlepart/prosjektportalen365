export type ProjectPhaseChecklistData = {
    stats?: {
        [status: string]: number;
    };
    items?: IProjectPhaseChecklistItem[];
};

export interface IProjectPhaseChecklistItem {
    ID: number;
    Title: string;
    GtComment: string;
    GtChecklistStatus: string;
    GtProjectPhase: {
        TermGuid: string;
    };
}

export class ProjectPhaseModel {
    public id: string;
    public letter: string;
    public checklistData: ProjectPhaseChecklistData;
    public properties: { [key: string]: any };

    constructor(
        public name: string,
        id: string,
        checklistData: ProjectPhaseChecklistData,
        properties: { [key: string]: any }
    ) {
        this.id = id.substring(6, 42);
        this.letter = this.name.substring(0, 1).toUpperCase();
        this.checklistData = checklistData || { stats: {}, items: [] };
        this.properties = properties;
    }

    public toString() {
        return `-1;#${this.name}|${this.id}`;
    }
}