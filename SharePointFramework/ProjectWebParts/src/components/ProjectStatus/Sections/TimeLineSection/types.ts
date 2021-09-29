import { IListSectionProps, IListSectionState, IListSectionData } from '../ListSection'

export interface ITimelineSectionProps extends IListSectionProps {
  
}

export type ITimelineSectionState = IListSectionState<ITimelineData>

export interface ITimelineData extends IListSectionData {
  
}