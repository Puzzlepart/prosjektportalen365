import { dateAdd, PnPClientStorage } from '@pnp/common';
import SpEntityPortalService, { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export class EntityDataService {
    public _spEntityPortalService: SpEntityPortalService;
    private _storage: PnPClientStorage;

    constructor(
        public hubSiteUrl: string,
        public siteId: string,
        public webUrl: string,
        public entity: ISpEntityPortalServiceParams,
    ) {
        this._spEntityPortalService = new SpEntityPortalService({ webUrl: hubSiteUrl, ...entity });
        this._storage = new PnPClientStorage();
        this._storage.local.deleteExpired();
    }

    /**
     * Fetch entity data context
     * 
     * @param {Date} expire Expire date
     */
    public async fetchContext(expire: Date = dateAdd(new Date(), 'day', 1)) {
        const storageKey = `entitydata_${this.siteId.replace(/-/g, '')}`;
        return await this._storage.local.getOrPut(storageKey, async () => {
            const [
                versionHistoryUrl,
                fields,
                editFormUrl,
            ] = await Promise.all([
                this._spEntityPortalService.getEntityVersionHistoryUrl(this.siteId, this.webUrl),
                this._spEntityPortalService.getEntityFields(),
                this._spEntityPortalService.getEntityEditFormUrl(this.siteId, this.webUrl),
            ]);
            return {
                versionHistoryUrl,
                fields,
                editFormUrl,
            };
        }, expire);
    }

    /**
     * Fetch entity item
     */
    public async fetchItem() {
        return await this._spEntityPortalService.getEntityItemFieldValues(this.siteId);
    }
}; 