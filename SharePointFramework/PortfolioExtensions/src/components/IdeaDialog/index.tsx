import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { format } from '@fluentui/react'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import strings from 'PortfolioExtensionsStrings'
import {
  Button,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle
} from '@fluentui/react-components'
import { IIdeaDialogProps } from './types'
import { FC, useContext } from 'react'
import { IDeaDialogContext } from './context'
import { Fluent } from 'pp365-shared-library'
import styles from './IdeaDialog.module.scss'

export const IdeaDialog: FC<IIdeaDialogProps> = (props) => {
  const context = useContext(IDeaDialogContext)

  return (
    <IDeaDialogContext.Provider value={context}>
      <Fluent>
        <DialogBody className={styles.ideaDialog}>
          <DialogTitle>{strings.IdeaProjectDataDialogTitle}</DialogTitle>
          <DialogContent>
            <UserMessage
              title={
                props.isBlocked
                  ? strings.IdeaProjectDataDialogBlockedTitle
                  : strings.IdeaProjectDataDialogInfoTitle
              }
              text={format(
                props.isBlocked
                  ? strings.IdeaProjectDataDialogBlockedText
                  : props.dialogDescription,
                encodeURIComponent(window.location.href)
              )}
              intent={props.isBlocked ? 'warning' : 'info'}
            />
          </DialogContent>
          <DialogActions>
            <Button title={strings.CancelLabel} onClick={props.close}>
              {strings.CancelLabel}
            </Button>
            <Button
              appearance='primary'
              title={strings.CreateLabel}
              onClick={props.submit}
              disabled={props.isBlocked}
            >
              {strings.CreateLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </Fluent>
    </IDeaDialogContext.Provider>
  )
}

export default class ProjectDataDialog extends BaseDialog {
  public ideaTitle: string
  public dialogDescription: string
  public isBlocked: boolean

  public render(): void {
    ReactDOM.render(
      <IdeaDialog
        close={this.close}
        submit={this.submit}
        ideaTitle={this.ideaTitle}
        dialogDescription={this.dialogDescription}
        isBlocked={this.isBlocked}
      />,
      this.domElement
    )
  }

  public getConfig(): IDialogConfiguration {
    return {
      isBlocking: false
    }
  }

  protected onAfterClose(): void {
    super.onAfterClose()
    ReactDOM.unmountComponentAtNode(this.domElement)
  }

  public submit = () => {
    return
  }
}
