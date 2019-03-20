import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, BenefitMeasurementIndicator } from './';
export declare class BenefitMeasurement extends BenefitBase {
    date: Date;
    value: number;
    achievement: number;
    achievementStr: string;
    trendIconProps: any;
    indicatorId: number;
    private indicator;
    /**
     *
     */
    constructor(result: IBenefitsSearchResult);
    /**
     * Calculate achievement
     *
     * @param {BenefitMeasurementIndicator} indicator Indicator
     */
    calculcateAchievement(indicator: BenefitMeasurementIndicator): BenefitMeasurement;
    /**
     * Set trend icon props
     *
     * @param {BenefitMeasurement} prevMeasurement Previous measurement
     */
    setTrendIconProps(prevMeasurement: BenefitMeasurement): BenefitMeasurement;
}
