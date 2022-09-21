/* eslint-disable max-classes-per-file */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  PrimaryButton,
  DialogFooter,
  DialogContent,
  DefaultButton,
  DialogType,
} from '@fluentui/react'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'

interface IDialogContentProps {
  close: () => void
  submit: () => void
  ideaTitle?: string
}

class IdeaDialog extends React.Component<IDialogContentProps> {
  constructor(props: IDialogContentProps | Readonly<IDialogContentProps>) {
    super(props)
  }

  public render(): JSX.Element {
    return (
      <DialogContent
        title={'Opprett prosjektdata for idéen'}
        subText={`Dette vil opprette et element i prosjektdata for følgende idé: ${this.props.ideaTitle}`}
        onDismiss={this.props.close}
        type={DialogType.largeHeader}
        showCloseButton={true}
        closeButtonAriaLabel={'Lukk'}
      >
        <DialogFooter>
          <DefaultButton
            text={'Avbryt'}
            title={'Avbryt'}
            onClick={this.props.close}
          />
          <PrimaryButton
            text={'Opprett'}
            title={'Opprett'}
            onClick={() => {
              this.props.submit()
            }}
          />
        </DialogFooter>
      </DialogContent>
    )
  }
}

export default class ProjectDataDialog extends BaseDialog {
  public ideaTitle: string

  public render(): void {
    ReactDOM.render(
      <IdeaDialog
        close={this.close}
        submit={this._submit}
        ideaTitle={this.ideaTitle}
      />,
      this.domElement
    )
  }

  public getConfig(): IDialogConfiguration {
    return {
      isBlocking: false,
    }
  }

  protected onAfterClose(): void {
    super.onAfterClose()
    ReactDOM.unmountComponentAtNode(this.domElement)
  }

  private _submit = () => {
    this.close()
  }
}
