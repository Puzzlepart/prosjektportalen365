import { ITimelineItem, ITimelineGroup } from 'interfaces'
import ReactTimeline, {
    ReactCalendarGroupRendererProps,
    ReactCalendarItemRendererProps,
    TimelineMarkers,
    TodayMarker
} from 'react-calendar-timeline'
import 'react-calendar-timeline/lib/Timeline.css'
import * as strings from 'PortfolioWebPartsStrings'
import styles from './Timeline.module.scss'
import './Timeline.overrides.css'
import moment from 'moment'
import React, { Component } from 'react'

export interface ITimelineProps {
    defaultTimeStart?: [number, moment.unitOfTime.DurationConstructor],
    defaultTimeEnd?: [number, moment.unitOfTime.DurationConstructor],
    groups: ITimelineGroup[],
    items: ITimelineItem[],
    _onItemClick: any
}

/**
 * @component Timeline
 * @extends Component
 */
export class Timeline extends Component<ITimelineProps> {
    constructor(props: ITimelineProps) {
        super(props)
    }

    public render(): React.ReactElement<ITimelineProps> {
        return (
            <div className={styles.timeline}>
                <ReactTimeline<any>
                    groups={this.props.groups}
                    items={this.props.items}
                    stackItems={true}
                    canMove={false}
                    canChangeGroup={false}
                    sidebarWidth={320}
                    itemRenderer={this._itemRenderer.bind(this)}
                    groupRenderer={this._groupRenderer.bind(this)}
                    defaultTimeStart={moment().add(...this.props.defaultTimeStart)}
                    defaultTimeEnd={moment().add(...this.props.defaultTimeEnd)}>
                    <TimelineMarkers>
                        <TodayMarker date={moment().toDate()} />
                    </TimelineMarkers>
                </ReactTimeline>
            </div >
        )
    }

    /**
     * Timeline item renderer
     */
    private _itemRenderer(props: ReactCalendarItemRendererProps<any>) {
        const htmlProps = props.getItemProps(props.item.itemProps)

        if (props.item.type === strings.MilestoneLabel)
            return (
                <div
                    {...htmlProps}
                    className={`${styles.timelineItem} rc-item`}
                    onClick={(event) => this.props._onItemClick(event, props.item)}>
                    <div
                        className={`${styles.itemContent} rc-milestoneitem-content`}
                        style={{
                            maxHeight: `${props.itemContext.dimensions.height}`,
                            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                            width: '22px',
                            height: '24px',
                            backgroundColor: '#ffc800',
                            marginTop: '-2px'
                        }}>
                    </div>
                </div>
            )

        return (
            <div
                {...htmlProps}
                className={`${styles.timelineItem} rc-item`}
                onClick={(event) => this.props._onItemClick(event, props.item)}>
                <div
                    className={`${styles.itemContent} rc-item-content`}
                    style={{ maxHeight: `${props.itemContext.dimensions.height}`, paddingLeft: '8px' }}>
                    {props.item.title}
                </div>
            </div>
        )
    }

    /**
     * Timeline group renderer
     */
    private _groupRenderer({ group }: ReactCalendarGroupRendererProps<ITimelineGroup>) {
        const style: React.CSSProperties = { display: 'block', width: '100%' }
        return (
            <div>
                <span style={style}>{group.title}</span>
            </div>
        )
    }
}
