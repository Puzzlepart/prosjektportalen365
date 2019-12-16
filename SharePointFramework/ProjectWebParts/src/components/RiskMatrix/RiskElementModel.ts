export class RiskElementModel {
    public id: string;
    public title: string;
    public probability: number;
    public consequence: number;
    public probabilityPostAction: number;
    public consequencePostAction: number;
    public action: string;
    public url: string;
    public webId: string;
    public webUrl: string;
    public siteTitle: string;

    constructor(id: string, title: string, probability: string, consequence: string, probabilityPostAction: string, consequencePostAction: string) {
        this.id = id;
        this.title = title;
        this.probability = parseInt(probability, 10);
        this.consequence = parseInt(consequence, 10);
        this.probabilityPostAction = parseInt(probabilityPostAction, 10);
        this.consequencePostAction = parseInt(consequencePostAction, 10);
    }
}