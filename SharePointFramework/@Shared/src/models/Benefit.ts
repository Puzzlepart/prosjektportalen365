import { IBenefitsSearchResult } from '../interfaces/IBenefitsSearchResult';
import { BenefitBase } from './';

export class Benefit extends BenefitBase {
    public type: string;
    public turnover: string;
    public responsible: string;
    public realizationTime: Date;

    /**
     *
     */
    constructor(result: IBenefitsSearchResult) {
        super(result);
        this.type = result.GtGainsTypeOWSCHCS;
        this.turnover = result.GtGainsTurnoverOWSMTXT;
        this.responsible = result.GtGainsResponsible;
        this.realizationTime = new Date(result.GtRealizationTimeOWSDATE);
    }
}