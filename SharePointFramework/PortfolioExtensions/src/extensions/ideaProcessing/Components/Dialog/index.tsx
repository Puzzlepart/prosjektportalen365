/* eslint-disable max-classes-per-file */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import {
  PrimaryButton,
  DialogFooter,
  DialogContent,
  Dropdown,
  IDropdownOption,
  DefaultButton,
  TextField,
} from '@fluentui/react'
interface IDialogContentProps {
  close: () => void
  submit: (choice: string, comment: string) => void
  ideaTitle?: string
}

interface IDialogContentState {
  choice: string
  comment: string
  isSubmitDisabled: boolean
}

class DialogPrompt extends React.Component<
  IDialogContentProps,
  IDialogContentState
> {
  constructor(props: IDialogContentProps | Readonly<IDialogContentProps>) {
    super(props)

    this.state = {
      choice: '',
      comment: '',
      isSubmitDisabled: true,
    }
  }

  public render(): JSX.Element {
    return (
      <DialogContent
        title='Anbefaling'
        subText={`Velg anbefaling for: ${this.props.ideaTitle}`}
        onDismiss={this.props.close}
        showCloseButton={true}
      >
        <Dropdown
          options={[
            { key: 'accept', text: 'Godkjenn' },
            { key: 'decline', text: 'Avvis' },
            { key: 'postpone', text: 'Under vurdering' },
          ]}
          onChange={this._onChoiceChange}
          label='Valg'
          placeholder='Vennligst velg handling'
        />

        <TextField
          placeholder='Kommentar'
          label='Kommentar til valg'
          multiline
          rows={3}
          onChange={this._onCommentChange}
        />

        <DialogFooter>
          <DefaultButton
            text='Cancel'
            title='Cancel'
            onClick={this.props.close}
          />
          <PrimaryButton
            text='OK'
            title='OK'
            onClick={() => {
              this.props.submit(this.state.choice, this.state.comment)
            }}
            disabled={this.state.comment.length > 0 && this.state.choice.length > 0 ? false : true}
          />
        </DialogFooter>
      </DialogContent>
    )
  }

  private _onChoiceChange = (
    _: React.FormEvent<HTMLDivElement>,
    choice: IDropdownOption
  ) => {
    this.setState({ choice: choice.text })
  }

  private _onCommentChange = (
    _: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    comment: string
  ) => {
    this.setState({ comment: comment })
  }
}

export default class RecommendationDialog extends BaseDialog {
  public message: string
  public selectedChoice: string
  public ideaTitle: string
  public comment: string

  public render(): void {
    ReactDOM.render(
      <DialogPrompt
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

    // Clean up the element for the next dialog
    ReactDOM.unmountComponentAtNode(this.domElement)
  }

  private _submit = (choice: string, comment: string) => {
    this.selectedChoice = choice
    this.comment = comment
    this.close()
  }
}
