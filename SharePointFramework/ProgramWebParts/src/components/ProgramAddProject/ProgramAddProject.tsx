import * as React from 'react';
import styles from './ProgramAddProject.module.scss';
import { IProgramAddProjectProps } from './IProgramAddProjectProps';
import { Timeline } from 'pp365-portfoliowebparts/lib/components/ProjectTimeline/Timeline'
import moment from 'moment'
export default class ProgramAddProject extends React.Component<IProgramAddProjectProps, {}> {
  public render(): React.ReactElement<IProgramAddProjectProps> {
    return (
      <>
        <Timeline items={items} groups={groups} _onItemClick={() => console.log()} defaultTimeStart={[-1, 'months']}
          defaultTimeEnd={[1, 'years']} />
      </>
    );
  }
}

const groups = [{ id: 1, title: 'group 1' }, { id: 2, title: 'group 2' }]

const items = [
  {
    id: 1,
    group: 1,
    title: 'item 1',
    start_time: moment(),
    end_time: moment().add(1, 'hour')
  },
  {
    id: 2,
    group: 2,
    title: 'item 2',
    start_time: moment().add(-0.5, 'hour'),
    end_time: moment().add(0.5, 'hour')
  },
  {
    id: 3,
    group: 1,
    title: 'item 3',
    start_time: moment().add(2, 'hour'),
    end_time: moment().add(3, 'hour')
  }
]