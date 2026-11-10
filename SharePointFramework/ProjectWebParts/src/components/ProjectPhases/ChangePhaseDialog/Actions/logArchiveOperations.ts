import * as strings from 'ProjectWebPartsStrings'
import { format, isUnauthorizedError } from 'pp365-shared-library'
import SPDataAdapter from '../../../../data'
import { IArchiveConfiguration } from '../Views/ArchiveView/types'

/**
 * Logs the archive operations to the hub's archive log (`Arkiveringslogg`), one entry for each
 * document and list. An entry the hub does not take for its own reason, such as a document whose
 * URL is longer than the reference field holds, does not stop the others. Denied access does,
 * since every entry would fail the same way.
 *
 * @param archiveConfiguration The documents and lists to archive
 * @param webUrl URL of the project
 * @param currentPhase Name of the phase the project leaves (optional)
 * @param targetPhase Name of the phase the project moves to (optional)
 *
 * @returns The first error from the hub, or `null` when every entry was written
 */
export async function logArchiveOperations(
  archiveConfiguration: IArchiveConfiguration,
  webUrl: string,
  currentPhase?: string,
  targetPhase?: string
): Promise<Error | null> {
  const phaseTransitionMessage =
    currentPhase && targetPhase
      ? format(strings.ArchivePhaseTransition, currentPhase, targetPhase)
      : undefined
  const writes: (() => Promise<Error | null>)[] = [
    ...(archiveConfiguration.documents ?? []).map(
      (doc) => () =>
        SPDataAdapter.logDocumentArchive(
          doc.title,
          strings.ArchiveLogStatusInProgress,
          phaseTransitionMessage,
          doc.url || '',
          webUrl
        )
    ),
    ...(archiveConfiguration.lists ?? []).map(
      (list) => () =>
        SPDataAdapter.logListArchive(
          list.title,
          strings.ArchiveLogStatusInProgress,
          phaseTransitionMessage,
          list.url || '',
          webUrl
        )
    )
  ]
  let firstError: Error | null = null
  for (const write of writes) {
    let error: Error | null
    try {
      error = await write()
    } catch (thrown) {
      error = thrown instanceof Error ? thrown : new Error(String(thrown))
    }
    if (!error) continue
    firstError = firstError ?? error
    if (isUnauthorizedError(error)) break
  }
  return firstError
}
