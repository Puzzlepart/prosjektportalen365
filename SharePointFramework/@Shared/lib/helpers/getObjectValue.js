import * as objectGet from 'object-get';
/**
 *
 * @param {any} object Object
 * @param {string} expression Expression
 * @param {T} fallback Fallback
 */
export default function getObjectValue(object, expression, fallback) {
    return objectGet(object, expression) || fallback;
}
;
//# sourceMappingURL=getObjectValue.js.map