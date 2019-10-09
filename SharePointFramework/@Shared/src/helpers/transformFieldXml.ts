import { DOMParser } from 'xmldom';
import { TypedHash } from '@pnp/common'

/**
 * Transform field XML, adding and removing the specified attributes
 * 
 * @param {string} schemaXml Schema xml
 * @param {Object} attributes Attributes
 * @param {Object} removeAttributes Attributes to remove
 */
export function transformFieldXml(schemaXml: string, attributes: TypedHash<string> = {}, removeAttributes: string[] = ['Version', 'SourceID', 'Required', 'WebId', 'List']): string {
    let { documentElement } = new DOMParser().parseFromString(schemaXml);
    for (let i = 0; i < removeAttributes.length; i++) {
        if (documentElement.hasAttribute(removeAttributes[i])) documentElement.removeAttribute(removeAttributes[i]);
    }
    for (let i = 0; i < Object.keys(attributes).length; i++) {
        let key = Object.keys(attributes)[i];
        documentElement.setAttribute(key, attributes[key]);
    }
    return documentElement.toString();
}