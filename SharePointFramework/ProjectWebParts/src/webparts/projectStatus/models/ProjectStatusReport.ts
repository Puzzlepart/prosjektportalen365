export default class ProjectStatusReport {
    public item: any;

    constructor(item: any) {
        this.item = item;
    }

    public toString() {
        return `${this.item.GtMonthChoice} ${this.item.Created.substring(0, 4)}`;
    }
}