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
var BenefitMeasurement = (function (_super) {
    __extends(BenefitMeasurement, _super);
    /**
     *
     */
    function BenefitMeasurement(result) {
        var _this = _super.call(this, result) || this;
        _this.date = new Date(result.GtMeasurementDateOWSDATE);
        _this.value = parseInt(result.GtMeasurementValueOWSNMBR, 10);
        _this.indicatorId = parseInt(result.GtMeasureIndicatorLookupId, 10);
        return _this;
    }
    BenefitMeasurement.prototype.calculcateAchievement = function (_a) {
        var startValue = _a.startValue, desiredValue = _a.desiredValue;
        this.achievement = Math.round(((this.value - startValue) / (desiredValue - startValue)) * 100) + "%";
        return this;
    };
    return BenefitMeasurement;
}(BenefitBase));
export { BenefitMeasurement };
//# sourceMappingURL=BenefitMeasurement.js.map