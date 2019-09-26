import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';

/**
 * Get url param
 * 
 * @param {string} key Key 
 */
export default function getUrlParam(key: string): string {
    return new UrlQueryParameterCollection(document.location.href).getValue(key);
}