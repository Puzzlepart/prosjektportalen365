/**
 * Transform field XML, adding and removing the specified attributes
 *
 * Parses and serializes with the browser's own `DOMParser` and `XMLSerializer` (jsdom has both in
 * the tests). The `xmldom` package it used before is unmaintained and has open advisories.
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
  const { documentElement } = new DOMParser().parseFromString(schemaXml, 'text/xml')
  for (let i = 0; i < removeAttributes.length; i++) {
    if (documentElement.hasAttribute(removeAttributes[i]))
      documentElement.removeAttribute(removeAttributes[i])
  }
  for (let i = 0; i < Object.keys(attributes).length; i++) {
    const key = Object.keys(attributes)[i]
    documentElement.setAttribute(key, attributes[key])
  }
  return new XMLSerializer().serializeToString(documentElement)
}
