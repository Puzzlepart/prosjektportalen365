import { DOMParser } from 'xmldom';

/**
 * Parse field XML
 * 
 * @param {SPField} siteField Site field
 * @param {Object} attributes Attributes
 */
export function parseFieldXml(siteField: { SchemaXml: string }, attributes: { [key: string]: string } = {}): string {
    let { documentElement } = new DOMParser().parseFromString(siteField.SchemaXml);
    documentElement.removeAttribute('Version');
    documentElement.removeAttribute('SourceID');
    documentElement.removeAttribute('Required');
    documentElement.removeAttribute('WebId');
    documentElement.removeAttribute('Hidden');
    documentElement.removeAttribute('List');
    for (let key of Object.keys(attributes)) {
        documentElement.setAttribute(key, attributes[key]);
    }
    return documentElement.toString();
}