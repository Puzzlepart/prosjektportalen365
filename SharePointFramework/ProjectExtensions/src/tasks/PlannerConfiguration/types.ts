export interface IPlannerPlan {
    id: string;
    title: string;
}

export class TaskAttachment {
    public url: string;
    public alias: string;
    public type: string;

    constructor(str: string) {
        const [url, alias, type] = str.split(';')
        this.url = this._encodeUrl(url)
        this.alias = alias
        this.type = type || 'Other'
    }

    /**
     * Encode URL, replacing %, . and :
     * 
     * See https://docs.microsoft.com/en-gb/graph/api/resources/plannerexternalreferences?view=graph-rest-1.0
     * 
     * @param url URL
     */
    private _encodeUrl(url: string) {
        return url
            .split('%').join('%25')
            .split('.').join('%2E')
            .split(':').join('%3A')
    }
}

export interface ITaskDetails {
    checklist?: string[];
    attachments?: TaskAttachment[];
}

export interface IPlannerConfiguration {
    [key: string]: {
        [key: string]: ITaskDetails;
    };
}

export interface IPlannerBucket {
    id: string;
    name: string;
    planId: string;
}
