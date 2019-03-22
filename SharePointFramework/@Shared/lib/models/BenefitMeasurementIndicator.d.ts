import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase, Benefit, BenefitMeasurement } from './';
export declare class BenefitMeasurementIndicator extends BenefitBase {
    indicator: string;
    startValue: number;
    desiredValue: number;
    startValueDisplay: string;
    desiredValueDisplay: string;
    unit: string;
    benefitId: number;
    measurements: BenefitMeasurement[];
    benefit: Benefit;
    /**
     * Creates a new instance of BenefitMeasurementIndicator
     *
     * @param {IBenefitsSearchResult} result Search result
     * @param {number} fractionDigits Fraction digits for valueDisplay
     */
    constructor(result: IBenefitsSearchResult, fractionDigits?: number);
    /**
     * Set measurements
     *
     * @param {BenefitMeasurement[]} measurements Measurements
     */
    setMeasurements(measurements: BenefitMeasurement[]): BenefitMeasurementIndicator;
    /**
     * Set benefit
     *
     * @param {Benefit[]} benefits Benefits
     */
    setBenefit(benefits: Benefit[]): BenefitMeasurementIndicator;
}
