/* eslint-disable max-classes-per-file */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  DialogFooter,
  DialogContent,
  DialogType,
  PrimaryButton,
  DefaultButton,
  format
} from '@fluentui/react'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import strings from 'PortfolioExtensionsStrings'

interface IDialogContentProps {
  close: () => void
  submit: () => void
  ideaTitle?: string
  dialogDescription?: string
  isBlocked?: boolean
}

class IdeaDialog extends React.Component<IDialogContentProps> {
  constructor(props: IDialogContentProps | Readonly<IDialogContentProps>) {
    super(props)
  }

  public render(): JSX.Element {
    return (
      <DialogContent
        title={strings.IdeaProjectDataDialogTitle}
        onDismiss={this.props.close}
        type={DialogType.largeHeader}
        showCloseButton={true}
        styles={{ content: { maxWidth: '420px' } }}
        closeButtonAriaLabel={strings.CloseLabel}
      >
        <UserMessage
          text={format(
            this.props.isBlocked
              ? strings.IdeaProjectDataDialogBlockedText
              : this.props.dialogDescription,
            encodeURIComponent(window.location.href)
          )}
          intent={this.props.isBlocked ? 'warning' : 'info'}
        />
        <DialogFooter>
          <DefaultButton
            text={strings.CancelLabel}
            title={strings.CancelLabel}
            onClick={this.props.close}
          />
          <PrimaryButton
            text={strings.CreateLabel}
            title={strings.CreateLabel}
            onClick={this.props.submit}
            disabled={this.props.isBlocked}
          />
        </DialogFooter>
      </DialogContent>
    )
  }
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
