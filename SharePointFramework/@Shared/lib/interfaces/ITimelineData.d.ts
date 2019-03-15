import { ITimelineItem } from "./ITimelineItem";
import { ITimelineGroup } from "./ITimelineGroup";
export interface ITimelineData<T> {
    items: ITimelineItem<T>[];
    groups: ITimelineGroup[];
}
