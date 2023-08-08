import { DOMParser } from 'xmldom'

/**
 * Transform field XML, adding and removing the specified attributes
 *
 * @param schemaXml Schema xml
 * @param attributes Attributes
 * @param removeAttributes Attributes to remove
 */
export function transformFieldXml(
  schemaXml: string,
  attributes: Record<string, string> = {},
  removeAttributes: string[] = ['Version', 'SourceID', 'Required', 'WebId', 'List']
): string {
  const { documentElement } = new DOMParser().parseFromString(schemaXml)
  for (let i = 0; i < removeAttributes.length; i++) {
    if (documentElement.hasAttribute(removeAttributes[i]))
      documentElement.removeAttribute(removeAttributes[i])
  }
  for (let i = 0; i < Object.keys(attributes).length; i++) {
    const key = Object.keys(attributes)[i]
    documentElement.setAttribute(key, attributes[key])
  }
  return documentElement.toString()
}
