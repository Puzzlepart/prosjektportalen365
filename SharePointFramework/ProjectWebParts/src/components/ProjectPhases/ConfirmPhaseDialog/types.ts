import { ProjectPhaseModel } from 'pp365-shared/lib/models'

export interface IConfirmPhaseDialogProps {
  phase: ProjectPhaseModel
  onConfirm: (result: boolean) => void
  isBlocking: boolean
  isChangingPhase: boolean
}
