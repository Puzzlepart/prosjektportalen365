/**
 * The custom content types a content type is built on, from the first custom one to the content
 * type itself. A content type ID is its parent's ID followed by either two hex digits (a built-in
 * child such as `0x0101`, which every site has) or `00` and a GUID (a custom content type, which
 * must be created on a site before its children can be).
 *
 * @param contentTypeId Content type ID, such as `0x0100805E…00<guid>`
 *
 * @returns The IDs of the custom content types in the lineage, the root first
 */
export function getContentTypeLineage(contentTypeId: string): string[] {
  const lineage: string[] = []
  let id = (contentTypeId ?? '').trim()
  if (!/^0x[0-9a-f]+$/i.test(id)) return lineage
  while (id.length > 4) {
    const isCustom = /00[0-9a-f]{32}$/i.test(id.slice(2))
    if (isCustom) lineage.unshift(id)
    id = id.slice(0, isCustom ? -34 : -2)
  }
  return lineage
}

/**
 * Whether a content type on a list is the list's own copy of a site content type. A list keeps a
 * child of each content type added to it: the site content type's ID followed by `00` and a GUID.
 *
 * @param listContentTypeId ID of a content type on a list
 * @param contentTypeId ID of the site content type
 */
export function isListContentTypeOf(listContentTypeId: string, contentTypeId: string): boolean {
  const listId = (listContentTypeId ?? '').toLowerCase()
  const siteId = (contentTypeId ?? '').toLowerCase()
  return siteId.length > 0 && listId.length === siteId.length + 34 && listId.startsWith(siteId)
}

/**
 * Whether a content type is built on another, however many content types lie between them: its
 * ID starts with the other's, which ends where a new part of the ID begins.
 *
 * @param contentTypeId ID of the content type
 * @param ancestorId ID of the content type it may be built on
 */
export function isBuiltOnContentType(contentTypeId: string, ancestorId: string): boolean {
  const id = (contentTypeId ?? '').toLowerCase()
  const ancestor = (ancestorId ?? '').toLowerCase()
  return ancestor.length > 0 && id.length > ancestor.length && id.startsWith(ancestor)
}
