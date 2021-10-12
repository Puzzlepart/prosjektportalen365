import { IListSectionProps, IListSectionState, IListSectionData } from '../ListSection'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITimelineSectionProps extends IListSectionProps { }

export type ITimelineSectionState = IListSectionState<ITimelineData>

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITimelineData extends IListSectionData { }