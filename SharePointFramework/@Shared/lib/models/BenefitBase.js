var BenefitBase = (function () {
    function BenefitBase(result) {
        this.path = result.Path;
        this.title = result.Title;
        this.siteTitle = result.SiteTitle;
        this.id = parseInt(result.ListItemId, 10);
        this.siteId = result.SiteId;
    }
    return BenefitBase;
}());
export { BenefitBase };
//# sourceMappingURL=BenefitBase.js.map