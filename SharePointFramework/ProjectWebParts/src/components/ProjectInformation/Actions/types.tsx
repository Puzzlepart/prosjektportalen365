export type ActionType = [string, string | (() => void), string, boolean?, boolean?]

export interface IActionsProps {
  /**
   * Custom actions
   */
  customActions?: ActionType[]
}
