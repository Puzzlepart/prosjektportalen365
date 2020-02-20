import { IBenefitsSearchResult } from 'interfaces';
import { BenefitBase } from './';

/**
 * @class Benefit
 */
export class Benefit extends BenefitBase {
    public type: string;
    public turnover: string;
    public responsible: string;
    public owner: string;
    public realizationTime: Date;

    /**
     *
     */
    constructor(result: IBenefitsSearchResult) {
        super(result);
        this.type = result.GtGainsTypeOWSCHCS;
        this.turnover = result.GtGainsTurnoverOWSMTXT;
        this.responsible = result.GtGainsResponsible;
        this.owner = result.GtGainsOwner;
        this.realizationTime = new Date(result.GtRealizationTimeOWSDATE);
    }
}