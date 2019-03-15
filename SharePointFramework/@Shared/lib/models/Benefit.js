var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { BenefitBase } from './';
var Benefit = (function (_super) {
    __extends(Benefit, _super);
    /**
     *
     */
    function Benefit(result) {
        var _this = _super.call(this, result) || this;
        _this.type = result.GtGainsTypeOWSCHCS;
        _this.turnover = result.GtGainsTurnoverOWSMTXT;
        _this.responsible = result.GtGainsResponsible;
        _this.realizationTime = new Date(result.GtRealizationTimeOWSDATE);
        return _this;
    }
    return Benefit;
}(BenefitBase));
export { Benefit };
//# sourceMappingURL=Benefit.js.map