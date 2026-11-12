export * from './InitialView'
export * from './SummaryView'
export * from './ChangingPhaseView'
export { ArchiveView } from './ArchiveView/ArchiveView'

/** Steps available in the phase-change dialog. */
export enum View {
  Initial,
  Summary,
  Archive,
  Confirm,
  ChangingPhase
}
