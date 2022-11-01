
export interface ICommandsProps {
  /**
   * Set Show Filter Panel
   */
  setShowFilterPanel: (showFilterPanel: boolean) => void;

  /**
   * On Group change
   * @param group Group
   */
  onGroupChange: (group: string) => void;

  /**
   * Is group by enabled
   */
  isGroupByEnabled?: boolean;
}
