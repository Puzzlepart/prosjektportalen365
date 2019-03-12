import * as moment from 'moment';

export interface ITimelineItem {
    id: number;
    title: string;
    group: number;
    start_time: moment.Moment;
    end_time: moment.Moment;
}