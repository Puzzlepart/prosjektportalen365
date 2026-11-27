/**
 * The content types a content type is built on below Item (`0x01`), from the first to the content
 * type itself. A content type ID is its parent's ID followed by either two hex digits other than
 * `00`, or `00` and a GUID. Both forms name custom content types: a template's own project
 * content type can be `0x0100805E…0CBA` as well as `0x0100805E…0C00<guid>`. The ID alone does
 * not say which of them a site has already, as it has `0x0101` (Document): the caller leaves
 * those out.
 *
 * @param contentTypeId Content type ID, such as `0x0100805E…0CBA`
 *
 * @returns The IDs in the lineage, the one built on Item first; none for a value that is not a
 * well-formed ID of a content type built on Item
 */
export function getContentTypeLineage(contentTypeId: string): string[] {
  const id = (contentTypeId ?? '').trim()
  if (!/^0x01[0-9a-f]*$/i.test(id)) return []
  const lineage: string[] = []
  let position = 4
  while (position < id.length) {
    const length = id.slice(position, position + 2) === '00' ? 34 : 2
    if (position + length > id.length) return []
    position += length
    lineage.push(id.slice(0, position))
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
