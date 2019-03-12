import { ITimelineItem } from "./ITimelineItem";
import { ITimelineGroup } from "./ITimelineGroup";

export interface ITimelineData {
    items: ITimelineItem[];
    groups: ITimelineGroup[];
}