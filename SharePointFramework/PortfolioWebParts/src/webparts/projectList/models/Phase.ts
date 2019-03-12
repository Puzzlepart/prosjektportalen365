import { ITermData } from "@pnp/sp-taxonomy";

export default class Phase {
    public term: ITermData;
    public id: string;
    public name: string;
    public checkPointStatus: { [phase: string]: number };

    constructor(term: ITermData, checkPointStatus = {}) {
        this.term = term;
        this.id = this.term.Id.substring(6, 42);
        this.name = this.term.Name;
        this.checkPointStatus = checkPointStatus;
    }

    public toString() {
        return `-1;#${this.name}|${this.id}`;
    }
}
