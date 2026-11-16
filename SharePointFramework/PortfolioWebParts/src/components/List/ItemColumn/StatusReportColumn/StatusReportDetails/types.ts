import { IStatusReport } from '../types'

/** A status report's details, as the status report cell's popover shows them. */
export interface IStatusReportDetailsProps {
  /** The project's title, which heads the details. */
  title: string

  /** When the report was published: «Status rapportert 3. nov. 2026». */
  reportedText: string

  report: IStatusReport

  /** The title of the overall status section, which heads the overall status. */
  overallStatusName?: string

  /** The project's status page with the report selected; none without the row's site address. */
  link?: string

  /** Pinned as a dialog, with a close button, rather than shown while the pointer rests. */
  pinned: boolean

  /** The id of the title, which names the surface. */
  titleId: string

  /** The id of the publishing date, which names the pinned surface with the title. */
  subtitleId: string

  /** The id of the overall status, which describes the pinned surface. */
  overallId: string

  /** Closes the pinned details. */
  onClose: () => void
}
