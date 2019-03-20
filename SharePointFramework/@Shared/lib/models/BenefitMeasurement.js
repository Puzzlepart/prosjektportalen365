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
    /**
     * Calculate achievement
     *
     * @param {BenefitMeasurementIndicator} indicator Indicator
     */
    BenefitMeasurement.prototype.calculcateAchievement = function (indicator) {
        this.indicator = indicator;
        var achievement = Math.round(((this.value - this.indicator.startValue) / (this.indicator.desiredValue - this.indicator.startValue)) * 100);
        this.achievement = achievement;
        this.achievementStr = achievement + "%";
        return this;
    };
    /**
     * Set trend icon props
     *
     * @param {BenefitMeasurement} prevMeasurement Previous measurement
     */
    BenefitMeasurement.prototype.setTrendIconProps = function (prevMeasurement) {
        var shouldIncrease = this.indicator.desiredValue > this.indicator.startValue;
        if (this.achievement >= 100) {
            this.trendIconProps = { iconName: "Trophy", style: { color: "gold" } };
        }
        if (prevMeasurement && prevMeasurement.value !== this.value) {
            var hasIncreased = this.value > prevMeasurement.value;
            if (shouldIncrease && hasIncreased || !shouldIncrease && !hasIncreased) {
                this.trendIconProps = { iconName: "StockUp", style: { color: "green" } };
            }
            else {
                this.trendIconProps = { iconName: "StockDown", style: { color: "red" } };
            }
        }
        return this;
    };
    return BenefitMeasurement;
}(BenefitBase));
export { BenefitMeasurement };
//# sourceMappingURL=BenefitMeasurement.js.map