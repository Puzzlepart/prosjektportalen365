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
     * Creates a new instance of BenefitMeasurementIndicator
     *
     * @param {IBenefitsSearchResult} result Search result
     * @param {number} fractionDigits Fraction digits for valueDisplay
     */
    function BenefitMeasurementIndicator(result, fractionDigits) {
        if (fractionDigits === void 0) { fractionDigits = 2; }
        var _this = _super.call(this, result) || this;
        _this.indicator = result.GtMeasureIndicatorOWSTEXT;
        _this.startValue = !isNaN(parseFloat(result.GtStartValueOWSNMBR)) ? parseFloat(result.GtStartValueOWSNMBR) : null;
        if (_this.startValue !== null) {
            _this.startValueDisplay = _this.startValue.toFixed(fractionDigits);
        }
        _this.desiredValue = !isNaN(parseFloat(result.GtDesiredValueOWSNMBR)) ? parseFloat(result.GtDesiredValueOWSNMBR) : null;
        if (_this.desiredValue !== null) {
            _this.desiredValueDisplay = _this.desiredValue.toFixed(fractionDigits);
        }
        _this.unit = result.GtMeasurementUnitOWSCHCS;
        _this.benefitId = parseInt(result.GtGainLookupId, 10);
        return _this;
    }
    /**
     * Set measurements
     *
     * @param {BenefitMeasurement[]} measurements Measurements
     */
    BenefitMeasurementIndicator.prototype.setMeasurements = function (measurements) {
        var _this = this;
        var _measurements = measurements.filter(function (m) { return m.indicatorId === _this.id && m.siteId === _this.siteId; });
        _measurements = _measurements.map(function (m, i) { return m.calculcateAchievement(_this); });
        _measurements = _measurements.map(function (m, i) { return m.setTrendIconProps(_measurements[i + 1]); });
        this.measurements = _measurements;
        return this;
    };
    /**
     * Set benefit
     *
     * @param {Benefit[]} benefits Benefits
     */
    BenefitMeasurementIndicator.prototype.setBenefit = function (benefits) {
        var _this = this;
        this.benefit = benefits.filter(function (b) { return b.id === _this.benefitId && b.siteId === _this.siteId; })[0];
        return this;
    };
    return BenefitMeasurementIndicator;
}(BenefitBase));
export { BenefitMeasurementIndicator };
//# sourceMappingURL=BenefitMeasurementIndicator.js.map