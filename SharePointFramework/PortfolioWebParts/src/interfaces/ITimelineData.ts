import { ITimelineGroup, ITimelineItem } from "./index";

export interface ITimelineData {
    items: ITimelineItem[];
    groups: ITimelineGroup[];
}