import * as React from 'react';
import styles from './ExperienceLog.module.scss';
import { IExperienceLogProps, ExperienceLogDefaultProps } from './IExperienceLogProps';
import { AggregatedSearchList } from '../';

export default class ExperienceLog extends React.Component<IExperienceLogProps, {}> {
  public static defaultProps = ExperienceLogDefaultProps;

  constructor(props: IExperienceLogProps) {
    super(props);
  }

  public render(): React.ReactElement<IExperienceLogProps> {
    return <AggregatedSearchList className={styles.experienceLog} {...this.props} />;
  }
}

export { IExperienceLogProps };