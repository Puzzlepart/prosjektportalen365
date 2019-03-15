import { Web } from '@pnp/sp';
var HubConfigurationService = (function () {
    function HubConfigurationService(hubSiteUrl) {
        this.web = new Web(hubSiteUrl);
    }
    HubConfigurationService.prototype.getProjectColumns = function () {
        return this.web.lists.getByTitle('Prosjektkolonner').items.get();
    };
    return HubConfigurationService;
}());
export { HubConfigurationService };
//# sourceMappingURL=HubConfigurationService.js.map