import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, BenefitMeasurementIndicator } from './';
export declare class BenefitMeasurement extends BenefitBase {
    date: Date;
    dateDisplay: string;
    value: number;
    valueDisplay: string;
    achievement: number;
    achievementDisplay: string;
    trendIconProps: any;
    indicatorId: number;
    private indicator;
    /**
    * Creates a new instance of BenefitMeasurement
    *
    * @param {IBenefitsSearchResult} result Search result
    * @param {number} fractionDigits Fraction digits for valueDisplay
    */
    constructor(result: IBenefitsSearchResult, fractionDigits?: number);
    /**
     * Calculate achievement
     *
     * @param {BenefitMeasurementIndicator} indicator Indicator
     * @param {number} fractionDigits Fraction digits used for achievementDisplay
     */
    calculcateAchievement(indicator: BenefitMeasurementIndicator, fractionDigits?: number): BenefitMeasurement;
    /**
     * Set trend icon props
     *
     * @param {BenefitMeasurement} prevMeasurement Previous measurement
     */
    setTrendIconProps(prevMeasurement: BenefitMeasurement): BenefitMeasurement;
}
