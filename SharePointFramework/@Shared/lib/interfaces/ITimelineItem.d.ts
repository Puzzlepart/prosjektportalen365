export interface ITimelineItem<T> {
    id: number;
    title: string;
    group: number;
    start_time: T;
    end_time: T;
}
