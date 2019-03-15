var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { BenefitBase } from './';
var BenefitMeasurementIndicator = (function (_super) {
    __extends(BenefitMeasurementIndicator, _super);
    /**
     *
     */
    function BenefitMeasurementIndicator(result) {
        var _this = _super.call(this, result) || this;
        _this.indicator = result.GtMeasureIndicatorOWSTEXT;
        _this.startValue = parseInt(result.GtStartValueOWSNMBR, 10);
        _this.desiredValue = parseInt(result.GtDesiredValueOWSNMBR, 10);
        _this.unit = result.GtMeasurementUnitOWSCHCS;
        _this.benefitId = parseInt(result.GtGainLookupId, 10);
        return _this;
    }
    BenefitMeasurementIndicator.prototype.setMeasurements = function (measurements) {
        var _this = this;
        this.measurements = measurements
            .filter(function (m) { return m.indicatorId === _this.id && m.siteId === _this.siteId; })
            .map(function (m) { return m.calculcateAchievement(_this); });
        return this;
    };
    BenefitMeasurementIndicator.prototype.setBenefit = function (benefits) {
        var _this = this;
        this.benefit = benefits.filter(function (b) { return b.id === _this.benefitId && b.siteId === _this.siteId; })[0];
        return this;
    };
    return BenefitMeasurementIndicator;
}(BenefitBase));
export { BenefitMeasurementIndicator };
//# sourceMappingURL=BenefitMeasurementIndicator.js.map