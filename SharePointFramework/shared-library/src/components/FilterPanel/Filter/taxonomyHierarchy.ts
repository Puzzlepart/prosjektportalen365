import { IColumn } from '@fluentui/react'
import { IFilterItemProps } from '../FilterItem/types'

/**
 * Delimiter SharePoint search uses between the levels of a taxonomy term path
 * when the parent term is included, e.g. `Parent:Child:Grandchild`.
 */
export const TAXONOMY_PATH_DELIMITER = ':'

export interface ITaxonomyTreeNode {
  /**
   * Label for this level — the segment between two delimiters
   * (e.g. `Adm. kommunalsjef BDK`).
   */
  segment: string

  /**
   * Full path from the root up to and including this node
   * (e.g. `Parent:Child`). Used as the filter value: because the portfolio
   * filtering is a substring match, selecting a parent path matches every
   * descendant term in the same branch.
   */
  path: string

  /**
   * Zero-based depth of the node in the tree.
   */
  level: number

  /**
   * The original flat filter item this node maps to, when an item's value ends
   * exactly at this level. `undefined` for purely intermediate levels.
   */
  item?: IFilterItemProps

  /**
   * Child nodes (next level of the hierarchy).
   */
  children: ITaxonomyTreeNode[]
}

/**
 * `true` when the filter `column` represents a taxonomy/"Tags" field. Resolves
 * the column's data type the same way `useOnRenderItemColumn` does
 * (`dataType` → `data.type` → `data.renderAs`) and checks for `tags`. This
 * covers both managed-metadata fields and plain text fields (single/multi) that
 * are configured with data type `Tags` in the column configuration list
 * (`Prosjektkolonner`).
 *
 * @param column Column for the filter
 */
export function isTaxonomyColumn(column?: IColumn): boolean {
  if (!column) return false
  const dataType = (column as any).dataType || column.data?.type || column.data?.renderAs
  return dataType === 'tags'
}

/**
 * `true` when the column is a taxonomy field and at least one of its values is
 * a delimited term path (`Parent:Child`). Only then is it worth rendering the
 * values as a hierarchy instead of a flat list.
 *
 * @param column Column for the filter
 * @param items Flat filter items
 */
export function shouldRenderAsHierarchy(column: IColumn, items: IFilterItemProps[]): boolean {
  if (!isTaxonomyColumn(column)) return false
  return (items ?? []).some((i) => (i.value ?? '').indexOf(TAXONOMY_PATH_DELIMITER) !== -1)
}

/**
 * Build a hierarchical tree from flat filter `items` whose values are
 * `:`-delimited term paths. Intermediate levels that no item maps to directly
 * still become selectable nodes so the whole branch can be filtered. The
 * `byPath` map allows callers to resolve a node from its path (e.g. when
 * translating selected paths back into filter items).
 *
 * @param items Flat filter items
 */
export function buildTaxonomyTree(items: IFilterItemProps[]): {
  roots: ITaxonomyTreeNode[]
  byPath: Map<string, ITaxonomyTreeNode>
} {
  const roots: ITaxonomyTreeNode[] = []
  const byPath = new Map<string, ITaxonomyTreeNode>()

  for (const item of items) {
    // Keep raw segments (no trimming) so a rebuilt parent path stays an exact
    // substring of the original value the substring filter matches against.
    const segments = (item.value ?? '')
      .split(TAXONOMY_PATH_DELIMITER)
      .filter((segment) => segment.length > 0)
    if (segments.length === 0) continue

    let parentPath = ''
    let siblings = roots
    segments.forEach((segment, index) => {
      const path = parentPath ? `${parentPath}${TAXONOMY_PATH_DELIMITER}${segment}` : segment
      let node = byPath.get(path)
      if (!node) {
        node = { segment, path, level: index, children: [] }
        byPath.set(path, node)
        siblings.push(node)
      }
      // The deepest segment is the value the original item represents.
      if (index === segments.length - 1) node.item = item
      parentPath = path
      siblings = node.children
    })
  }

  sortNodes(roots)
  return { roots, byPath }
}

/**
 * `true` when any descendant of `node` has its path in `selectedPaths`. Used to
 * render a parent as indeterminate when one of its children is selected.
 *
 * @param node Tree node
 * @param selectedPaths Set of currently selected paths
 */
export function hasSelectedDescendant(
  node: ITaxonomyTreeNode,
  selectedPaths: Set<string>
): boolean {
  return node.children.some(
    (child) => selectedPaths.has(child.path) || hasSelectedDescendant(child, selectedPaths)
  )
}

/**
 * Collects the paths of every node that has children. Used to expand the whole
 * tree by default so no values are hidden when the panel first opens.
 *
 * @param nodes Tree nodes
 */
export function collectExpandablePaths(nodes: ITaxonomyTreeNode[]): Set<string> {
  const paths = new Set<string>()
  const visit = (node: ITaxonomyTreeNode) => {
    if (node.children.length > 0) {
      paths.add(node.path)
      node.children.forEach(visit)
    }
  }
  nodes.forEach(visit)
  return paths
}

function sortNodes(nodes: ITaxonomyTreeNode[]): void {
  nodes.sort((a, b) => a.segment.localeCompare(b.segment))
  nodes.forEach((node) => sortNodes(node.children))
}
