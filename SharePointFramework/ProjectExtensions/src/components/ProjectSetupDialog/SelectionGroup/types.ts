import { ReactNode } from 'react'

/** What a selection group lists: an extension or a list content configuration. */
export interface ISelectionGroupItem {
  key: string | number
  text: string
  subText?: string
}

/** A titled list of items to tick, with its count and, for a long list, a search box. */
export interface ISelectionGroupProps {
  title: string

  /** What the group is for, behind the info button beside its title. */
  info?: string

  items: ISelectionGroupItem[]

  selectedKeys: Set<string>

  /** Items that stay selected: shown ticked, marked as required and not changed by a click. */
  lockedKeys: Set<string>

  /** The explanation of the required mark, as its tooltip. */
  lockedText: string

  onToggle: (key: string, checked: boolean) => void

  /** How many are selected, e.g. «2 av 5 valgt». */
  countText: string

  /** Shown instead of the list when the group has nothing to choose from. */
  emptyText: string

  /** A note above the list. */
  note?: string

  showSearch: boolean

  searchTerm: string

  onSearch: (searchTerm: string) => void

  searchLabel: string

  searchPlaceholder: string

  /** Marks after an item's title, e.g. «Lagt til». */
  renderItemBadge?: (item: ISelectionGroupItem) => ReactNode

  /** A message under an item's description. */
  renderItemMessage?: (item: ISelectionGroupItem) => ReactNode
}
