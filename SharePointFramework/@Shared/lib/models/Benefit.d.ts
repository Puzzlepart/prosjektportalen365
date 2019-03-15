import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase } from './';
export declare class Benefit extends BenefitBase {
    type: string;
    turnover: string;
    responsible: string;
    realizationTime: Date;
    /**
     *
     */
    constructor(result: IBenefitsSearchResult);
}
