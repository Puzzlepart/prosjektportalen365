import { Checkbox } from '@fluentui/react-components'
import React, { FC } from 'react'
import { getFluentIcon } from '../../../icons'
import styles from './Filter.module.scss'
import { hasSelectedDescendant, ITaxonomyTreeNode } from './taxonomyHierarchy'

/**
 * Horizontal indentation (in pixels) applied per hierarchy level.
 */
const INDENT_PER_LEVEL = 16

export interface ITaxonomyFilterTreeProps {
  /**
   * Nodes to render at this level.
   */
  nodes: ITaxonomyTreeNode[]

  /**
   * Paths that are explicitly selected.
   */
  selectedPaths: Set<string>

  /**
   * Paths of nodes that are expanded.
   */
  expandedPaths: Set<string>

  /**
   * Toggle the selected state of a node.
   */
  onToggleSelect: (node: ITaxonomyTreeNode) => void

  /**
   * Toggle the expanded state of a node.
   */
  onToggleExpand: (node: ITaxonomyTreeNode) => void
}

/**
 * Renders taxonomy filter values as an indented, collapsible hierarchy. Every
 * level is a checkbox: selecting a leaf filters that term, while selecting a
 * parent filters the whole branch (the filtering is a substring match against
 * the term path). A parent is shown as indeterminate when one of its children
 * is selected but the parent itself is not.
 */
export const TaxonomyFilterTree: FC<ITaxonomyFilterTreeProps> = (props) => {
  return (
    <>
      {props.nodes.map((node) => {
        const hasChildren = node.children.length > 0
        const isExpanded = props.expandedPaths.has(node.path)
        const isSelected = props.selectedPaths.has(node.path)
        const isIndeterminate = !isSelected && hasSelectedDescendant(node, props.selectedPaths)
        return (
          <div key={node.path} className={styles.treeNode}>
            <div
              className={styles.treeRow}
              style={{ paddingLeft: node.level * INDENT_PER_LEVEL }}
            >
              {hasChildren ? (
                <span
                  className={styles.expandToggle}
                  role='button'
                  aria-expanded={isExpanded}
                  aria-label={node.segment}
                  onClick={() => props.onToggleExpand(node)}
                >
                  {getFluentIcon(isExpanded ? 'ChevronDown' : 'ChevronRight', { size: 14 })}
                </span>
              ) : (
                <span className={styles.expandSpacer} />
              )}
              <Checkbox
                className={styles.filterItem}
                label={node.segment}
                checked={isSelected ? true : isIndeterminate ? 'mixed' : false}
                onChange={() => props.onToggleSelect(node)}
              />
            </div>
            {hasChildren && isExpanded && (
              <TaxonomyFilterTree
                {...props}
                nodes={node.children}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
