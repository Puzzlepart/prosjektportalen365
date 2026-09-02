import React, { useMemo, useState } from 'react'
import { FilterItem } from '../FilterItem/FilterItem'
import { IFilterItemProps } from '../FilterItem/types'
import { TaxonomyFilterTree } from './TaxonomyFilterTree'
import {
  buildTaxonomyTree,
  collectExpandablePaths,
  ITaxonomyTreeNode,
  shouldRenderAsHierarchy
} from './taxonomyHierarchy'
import { IFilterProps, IFilterState } from './types'

export function useFilter(props: IFilterProps) {
  const isHierarchy = useMemo(
    () => shouldRenderAsHierarchy(props.column, props.items),
    [props.column, props.items]
  )
  const { roots, byPath } = useMemo(
    () =>
      isHierarchy
        ? buildTaxonomyTree(props.items)
        : { roots: [] as ITaxonomyTreeNode[], byPath: new Map<string, ITaxonomyTreeNode>() },
    [isHierarchy, props.items]
  )

  const [state, setState] = useState<IFilterState>({
    isCollapsed: props.defaultCollapsed,
    items: props.items
  })

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(
    () => new Set(props.items.filter((i) => i.selected).map((i) => i.value))
  )
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    collectExpandablePaths(roots)
  )

  /**
   * On change filter item
   *
   * @param item Item that was changed
   * @param checked Item checked
   */
  const onChange = (item: IFilterItemProps, checked: boolean) => {
    const items = state.items.map((i) => {
      if (i.value === item.value) {
        return { ...i, selected: checked }
      }
      return i
    })

    setState((prevState) => ({ ...prevState, items }))
    const selectedItems = items.filter(({ selected }) => selected)
    props.onFilterChange(props.column, selectedItems)
  }

  /**
   * On toggle the selected state of a hierarchy node. Selecting a parent does
   * not select its children, while selecting a child leaves the parent shown as
   * indeterminate (a parent is only checked solid when explicitly selected). The
   * selected paths are emitted as filter values — the portfolio substring filter
   * then matches the whole branch when a parent path is selected.
   *
   * @param node Node that was toggled
   */
  const onToggleSelect = (node: ITaxonomyTreeNode) => {
    const nextSelected = new Set(selectedPaths)
    if (nextSelected.has(node.path)) {
      nextSelected.delete(node.path)
    } else {
      nextSelected.add(node.path)
    }
    setSelectedPaths(nextSelected)
    const selectedItems: IFilterItemProps[] = Array.from(nextSelected).map((path) => {
      const matchingNode = byPath.get(path)
      return {
        name: matchingNode?.segment ?? path,
        value: path,
        selected: true,
        column: props.column
      }
    })
    props.onFilterChange(props.column, selectedItems)
  }

  /**
   * On toggle the expanded state of a hierarchy node.
   *
   * @param node Node that was toggled
   */
  const onToggleExpand = (node: ITaxonomyTreeNode) => {
    setExpandedPaths((prevPaths) => {
      const nextPaths = new Set(prevPaths)
      if (nextPaths.has(node.path)) {
        nextPaths.delete(node.path)
      } else {
        nextPaths.add(node.path)
      }
      return nextPaths
    })
  }

  /**
   * On toggle section content
   */
  const onToggleSectionContent = () => {
    setState((prevState) => ({ ...prevState, isCollapsed: !prevState.isCollapsed }))
  }

  /**
   * Render filter items, either as a flat list or — for taxonomy fields whose
   * values are `:`-delimited term paths — as an indented, collapsible hierarchy.
   */
  const renderItems = () => {
    if (isHierarchy) {
      return (
        <TaxonomyFilterTree
          nodes={roots}
          selectedPaths={selectedPaths}
          expandedPaths={expandedPaths}
          onToggleSelect={onToggleSelect}
          onToggleExpand={onToggleExpand}
        />
      )
    }
    return state.items.map((item, idx) => (
      <FilterItem
        key={idx}
        {...item}
        column={props.column}
        onChange={(_event, { checked }) => onChange(item, checked as boolean)}
      />
    ))
  }

  return { state, onToggleSectionContent, renderItems }
}
