import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, Benefit, BenefitMeasurement } from './';

export class BenefitMeasurementIndicator extends BenefitBase {
    public indicator: string;
    public startValue: number;
    public desiredValue: number;
    public unit: string;
    public benefitId: number;
    public measurements: BenefitMeasurement[];
    public benefit: Benefit;

    /**
     *
     */
    constructor(result: IBenefitsSearchResult) {
        super(result);
        this.indicator = result.GtMeasureIndicatorOWSTEXT;
        this.startValue = parseInt(result.GtStartValueOWSNMBR, 10);
        this.desiredValue = parseInt(result.GtDesiredValueOWSNMBR, 10);
        this.unit = result.GtMeasurementUnitOWSCHCS;
        this.benefitId = parseInt(result.GtGainLookupId, 10);
    }

    public setMeasurements(measurements: BenefitMeasurement[]): BenefitMeasurementIndicator {
        this.measurements = measurements
            .filter(m => m.indicatorId === this.id && m.siteId === this.siteId)
            .map(m => m.calculcateAchievement(this));
        return this;
    }

    public setBenefit(benefits: Benefit[]): BenefitMeasurementIndicator {
        this.benefit = benefits.filter(b => b.id === this.benefitId && b.siteId === this.siteId)[0];
        return this;
    }
}