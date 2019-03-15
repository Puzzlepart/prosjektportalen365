import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, BenefitMeasurementIndicator } from './';

export class BenefitMeasurement extends BenefitBase {
    public date: Date;
    public value: number;
    public achievement: string;
    public indicatorId: number;

    /**
     *
     */
    constructor(result: IBenefitsSearchResult) {
        super(result);
        this.date = new Date(result.GtMeasurementDateOWSDATE);
        this.value = parseInt(result.GtMeasurementValueOWSNMBR, 10);
        this.indicatorId = parseInt(result.GtMeasureIndicatorLookupId, 10);
    }

    public calculcateAchievement({ startValue, desiredValue }: BenefitMeasurementIndicator): BenefitMeasurement {
        this.achievement = `${Math.round(((this.value - startValue) / (desiredValue - startValue)) * 100)}%`;
        return this;
    }
}