import { IProgressProps } from 'pp365-shared-library'

/** Message and progress shown by a blocking project information operation. */
export interface IProgressDialogProps {
  /**
   * Title of the dialog. Previously inherited from the Fluent UI v8
   * `IDialogContentProps`, of which only this field was ever used.
   */
  title?: string

  progress: IProgressProps
}
