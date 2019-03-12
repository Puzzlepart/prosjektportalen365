import { ITermData } from "@pnp/sp-taxonomy";

export type PhaseChecklistData = { stats?: { [status: string]: number }, items?: any[] };

export default class Phase {
    public term: ITermData;
    public id: string;
    public name: string;
    public letter: string;
    public checklistData: PhaseChecklistData;
    public properties: {[key: string]: any};

    constructor(term: ITermData, checklistData: PhaseChecklistData, properties: {[key: string]: any}) {
        this.term = term;
        this.id = this.term.Id.substring(6, 42);
        this.name = this.term.Name;
        this.letter = this.name.substring(0, 1).toUpperCase();
        this.checklistData = checklistData;
        this.properties = properties;
    }

    public toString() {
        return `-1;#${this.name}|${this.id}`;
    }
}