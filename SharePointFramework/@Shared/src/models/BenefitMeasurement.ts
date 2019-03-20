import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, BenefitMeasurementIndicator } from './';

export class BenefitMeasurement extends BenefitBase {
    public date: Date;
    public value: number;
    public achievement: number;
    public achievementStr: string;
    public trendIconProps: any;
    public indicatorId: number;
    private indicator: BenefitMeasurementIndicator;

    /**
     *
     */
    constructor(result: IBenefitsSearchResult) {
        super(result);
        this.date = new Date(result.GtMeasurementDateOWSDATE);
        this.value = parseInt(result.GtMeasurementValueOWSNMBR, 10);
        this.indicatorId = parseInt(result.GtMeasureIndicatorLookupId, 10);
    }

    /**
     * Calculate achievement
     *
     * @param {BenefitMeasurementIndicator} indicator Indicator
     */
    public calculcateAchievement(indicator: BenefitMeasurementIndicator): BenefitMeasurement {
        this.indicator = indicator;
        let achievement = Math.round(((this.value - this.indicator.startValue) / (this.indicator.desiredValue - this.indicator.startValue)) * 100);
        this.achievement = achievement;
        this.achievementStr = `${achievement}%`;
        return this;
    }

    /**
     * Set trend icon props
     *
     * @param {BenefitMeasurement} prevMeasurement Previous measurement
     */
    public setTrendIconProps(prevMeasurement: BenefitMeasurement): BenefitMeasurement {
        let shouldIncrease = this.indicator.desiredValue > this.indicator.startValue;
        if (this.achievement >= 100) {
            this.trendIconProps = { iconName: "Trophy", style: { color: "gold" } };
        }
        if (prevMeasurement && prevMeasurement.value !== this.value) {
            let hasIncreased = this.value > prevMeasurement.value;
            if (shouldIncrease && hasIncreased || !shouldIncrease && !hasIncreased) {
                this.trendIconProps = { iconName: "StockUp", style: { color: "green" } };
            } else {
                this.trendIconProps = { iconName: "StockDown", style: { color: "red" } };
            }
        }
        return this;
    }
}