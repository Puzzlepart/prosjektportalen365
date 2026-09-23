import { IProgressProps } from 'pp365-shared-library'

export interface IProgressDialogProps {
  /**
   * Title of the dialog. Previously inherited from the Fluent UI v8
   * `IDialogContentProps`, of which only this field was ever used.
   */
  title?: string

  /**
   * Progress of the operation the dialog is reporting on.
   */
  progress: IProgressProps
}
