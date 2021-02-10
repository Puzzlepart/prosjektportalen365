import { AnyAction } from '@reduxjs/toolkit'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITargetFolderScreenProps {
  dispatch: React.Dispatch<AnyAction>

  /**
   * Target folder
   */
  targetFolder: string
}
