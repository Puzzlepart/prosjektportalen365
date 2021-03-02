import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator'
import * as strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { BaseDialog } from '../@BaseDialog/index'
import { IProgressDialogProps } from './types'
import styles from './ProgressDialog.module.scss'

export class ProgressDialog extends React.PureComponent<IProgressDialogProps> {
  public render() {
    return (
      <BaseDialog
        version={this.props.version}
        modalProps={{ isBlocking: true, isDarkOverlay: true }}
        dialogContentProps={{
          title: strings.ProgressDialogTitle,
          subText: strings.ProgressDialogSubText,
          className: styles.content
        }}
        onDismiss={this.props.onDismiss}
        containerClassName={styles.progressDialog}>
        <div className={styles.icon}>
          <Icon
            iconName={this.props.iconName}
            style={{ fontSize: 42, display: 'block', textAlign: 'center' }}
          />
        </div>
        <div className={styles.indicator}>
          <ProgressIndicator label={this.props.text} description={this.props.subText} />
        </div>
      </BaseDialog>
    )
  }
}

export { IProgressDialogProps }
