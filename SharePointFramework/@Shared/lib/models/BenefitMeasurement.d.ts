import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, BenefitMeasurementIndicator } from './';
export declare class BenefitMeasurement extends BenefitBase {
    date: Date;
    value: number;
    achievement: string;
    indicatorId: number;
    /**
     *
     */
    constructor(result: IBenefitsSearchResult);
    calculcateAchievement({startValue, desiredValue}: BenefitMeasurementIndicator): BenefitMeasurement;
}
