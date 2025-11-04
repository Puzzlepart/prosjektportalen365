export * from './InitialView'
export * from './SummaryView'
export * from './ChangingPhaseView'
export { ArchiveView } from './ArchiveView/ArchiveView'

export enum View {
  Initial,
  Summary,
  Archive,
  Confirm,
  ChangingPhase
}
