import * as React from 'react';
import styles from './ExperienceLog.module.scss';
import { IExperienceLogProps, ExperienceLogDefaultProps } from './IExperienceLogProps';
import AggregatedSearchList from '../../../components/AggregatedSearchList';

export default class ExperienceLog extends React.Component<IExperienceLogProps, {}> {
  public static defaultProps = ExperienceLogDefaultProps;

  constructor(props: IExperienceLogProps) {
    super(props);
  }

  public render(): React.ReactElement<IExperienceLogProps> {
    return (
      <div className={styles.experienceLog}>
        <AggregatedSearchList {...this.props} />
      </div>
    );
  }
}
