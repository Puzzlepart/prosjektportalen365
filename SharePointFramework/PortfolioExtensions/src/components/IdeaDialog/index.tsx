import * as React from 'react'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import strings from 'PortfolioExtensionsStrings'
import {
  Button,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { IIdeaDialogProps } from './types'
import { FC, useContext } from 'react'
import { IDeaDialogContext } from './context'
import { customLightTheme, format, renderReact, unmountReact } from 'pp365-shared-library'
import styles from './IdeaDialog.module.scss'

/** Confirms project-data creation only for approved ideas without an existing link. */
export const IdeaDialog: FC<IIdeaDialogProps> = (props) => {
  const fluentProviderId = useId('fp-idea-dialog')
  const context = useContext(IDeaDialogContext)

  return (
    <IDeaDialogContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.ideaDialog}>
          <DialogBody className={styles.dialogBody}>
            <DialogTitle>{strings.IdeaProjectDataDialogTitle}</DialogTitle>
            <DialogContent className={styles.content}>
              <UserMessage
                title={
                  props.isBlocked
                    ? strings.IdeaProjectDataDialogBlockedTitle
                    : strings.IdeaProjectDataDialogInfoTitle
                }
                text={format(
                  props.isBlocked
                    ? strings.IdeaProjectDataDialogBlockedMessage
                    : props.isApproved
                      ? (props.dialogMessage ?? '')
                      : strings.IdeaProjectDataDialogNotApprovedMessage,
                  encodeURIComponent(window.location.href)
                )}
                intent={props.isBlocked || !props.isApproved ? 'warning' : 'info'}
              />
              {/* Rendered only on a failure: a message bar reads itself out as it mounts. */}
              {props.errorMessage && <UserMessage text={props.errorMessage} intent='error' />}
            </DialogContent>
            <DialogActions>
              <Button title={strings.CancelLabel} onClick={props.onClose}>
                {strings.CancelLabel}
              </Button>
              <Button
                appearance='primary'
                title={strings.CreateLabel}
                onClick={props.onSubmit}
                disabled={props.isBlocked || !props.isApproved}
              >
                {strings.CreateLabel}
              </Button>
            </DialogActions>
          </DialogBody>
        </FluentProvider>
      </IdPrefixProvider>
    </IDeaDialogContext.Provider>
  )
}

/** Hosts project-data confirmation in an SPFx dialog with a replaceable submit callback. */
export default class ProjectDataDialog extends BaseDialog {
  public ideaTitle: string
  public dialogMessage: string
  public isBlocked: boolean
  public isApproved: boolean
  public errorMessage: string

  public render(): void {
    renderReact(
      <IdeaDialog
        onClose={this.close}
        onSubmit={this.submit}
        ideaTitle={this.ideaTitle}
        dialogMessage={this.dialogMessage}
        isBlocked={this.isBlocked}
        isApproved={this.isApproved}
        errorMessage={this.errorMessage}
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
    unmountReact(this.domElement)
  }

  public submit = () => {
    return
  }

  /**
   * Shows why the project data was not created, as an error in the dialog, which stays open; with
   * no message the error is taken away. A closed dialog only keeps the message.
   *
   * @param message The text to show, or none to take the error away
   */
  public setErrorMessage(message?: string): void {
    this.errorMessage = message
    if (this.isOpen) this.render()
  }
}
