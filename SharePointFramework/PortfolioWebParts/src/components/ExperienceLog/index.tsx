import * as React from 'react'
import { AggregatedSearchList } from '../AggregatedSearchList'
import styles from './ExperienceLog.module.scss'
import { EXPERIENCE_LOG_COLUMNS } from './ExperienceLogColumns'
import { IExperienceLogProps } from './IExperienceLogProps'

/**
 * @component ExperienceLog
 * @extends React.Component
 */
export class ExperienceLog extends React.Component<IExperienceLogProps, {}> {
  public static defaultProps: Partial<IExperienceLogProps> = {
    columns: EXPERIENCE_LOG_COLUMNS,
    showExcelExportButton: true,
  };

  constructor(props: IExperienceLogProps) {
    super(props)
  }

  public render(): React.ReactElement<IExperienceLogProps> {
    return <AggregatedSearchList className={styles.experienceLog} {...this.props} />
  }
}

export { IExperienceLogProps }
