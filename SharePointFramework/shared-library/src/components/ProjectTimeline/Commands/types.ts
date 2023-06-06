export interface ICommandsProps {
  /**
   * Set Show Filter Panel
   */
  setShowFilterPanel: (showFilterPanel: boolean) => void

  /**
   * On Group change
   *
   * @param groupBy Group by
   */
  onGroupByChange?: (groupBy: string) => void

  /**
   * Is group by enabled
   */
  isGroupByEnabled?: boolean

  /**
   * Default group by
   */
  defaultGroupBy?: string
}
