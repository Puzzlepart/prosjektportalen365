import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, Benefit, BenefitMeasurement } from './';

export class BenefitMeasurementIndicator extends BenefitBase {
    public indicator: string;
    public startValue: number;
    public desiredValue: number;
    public startValueDisplay: string;
    public desiredValueDisplay: string;
    public unit: string;
    public benefitId: number;
    public measurements: BenefitMeasurement[];
    public benefit: Benefit;

    /**
     * Creates a new instance of BenefitMeasurementIndicator
     *
     * @param {IBenefitsSearchResult} result Search result
     * @param {number} fractionDigits Fraction digits for valueDisplay
     */
    constructor(result: IBenefitsSearchResult, fractionDigits: number = 2) {
        super(result);
        this.indicator = result.GtMeasureIndicatorOWSTEXT;
        this.startValue = !isNaN(parseFloat(result.GtStartValueOWSNMBR)) ? parseFloat(result.GtStartValueOWSNMBR) : null;
        if (this.startValue !== null) {
            this.startValueDisplay = this.startValue.toFixed(fractionDigits);
        }
        this.desiredValue = !isNaN(parseFloat(result.GtDesiredValueOWSNMBR)) ? parseFloat(result.GtDesiredValueOWSNMBR) : null;
        if (this.desiredValue !== null) {
            this.desiredValueDisplay = this.desiredValue.toFixed(fractionDigits);
        }
        this.unit = result.GtMeasurementUnitOWSCHCS;
        this.benefitId = parseInt(result.GtGainLookupId, 10);
    }

    /**
     * Set measurements
     *
     * @param {BenefitMeasurement[]} measurements Measurements
     */
    public setMeasurements(measurements: BenefitMeasurement[]): BenefitMeasurementIndicator {
        let _measurements = measurements.filter(m => m.indicatorId === this.id && m.siteId === this.siteId);
        _measurements = _measurements.map((m, i) => m.calculcateAchievement(this));
        _measurements = _measurements.map((m, i) => m.setTrendIconProps(_measurements[i + 1]));
        this.measurements = _measurements;
        return this;
    }

    /**
     * Set benefit
     *
     * @param {Benefit[]} benefits Benefits
     */
    public setBenefit(benefits: Benefit[]): BenefitMeasurementIndicator {
        this.benefit = benefits.filter(b => b.id === this.benefitId && b.siteId === this.siteId)[0];
        return this;
    }
}
