/* eslint-disable max-classes-per-file */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import {
  DialogFooter,
  DialogContent,
  DialogType,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  TextField,
  format,
  MessageBarType
} from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'

interface IDialogContentProps {
  close: () => void
  submit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogDescription?: string
}

interface IDialogContentState {
  choice: string
  comment: string
}

class DialogPrompt extends React.Component<IDialogContentProps, IDialogContentState> {
  constructor(props: IDialogContentProps | Readonly<IDialogContentProps>) {
    super(props)

    this.state = {
      choice: '',
      comment: ''
    }
  }

  public render(): JSX.Element {
    return (
      <DialogContent
        title={strings.SetRecommendationTitle}
        type={DialogType.largeHeader}
        onDismiss={this.props.close}
        showCloseButton={true}
        styles={{ content: { maxWidth: '420px' } }}
      >
        <UserMessage
          text={format(
            strings.SetRecommendationSubtitle,
            this.props.ideaTitle,
            this.props.dialogDescription
          )}
          type={MessageBarType.info}
        />
        <Dropdown
          label={strings.ActionLabel}
          placeholder={strings.ActionLabelPlaceholder}
          options={[
            { key: 'approve', text: strings.ApproveChoice },
            { key: 'consideration', text: strings.ConsiderationChoice },
            { key: 'reject', text: strings.RejectChoice }
          ]}
          onChange={this._onChoiceChange}
        />

        <TextField
          placeholder={strings.CommentLabel}
          label={strings.CommentLabelPlaceholder}
          multiline
          rows={3}
          onChange={this._onCommentChange}
        />

        <DialogFooter>
          <DefaultButton
            text={strings.CancelLabel}
            title={strings.CancelLabel}
            onClick={this.props.close}
          />
          <PrimaryButton
            text={strings.SubmitLabel}
            title={strings.SubmitLabel}
            onClick={() => {
              this.props.submit(this.state.choice, this.state.comment)
            }}
            disabled={this.state.comment.length > 0 && this.state.choice.length > 0 ? false : true}
          />
        </DialogFooter>
      </DialogContent>
    )
  }

  private _onChoiceChange = (_: React.FormEvent<HTMLDivElement>, choice: IDropdownOption) => {
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
  public dialogDescription: string
  public comment: string

  public render(): void {
    ReactDOM.render(
      <DialogPrompt
        close={this.close}
        submit={this._submit}
        ideaTitle={this.ideaTitle}
        dialogDescription={this.dialogDescription}
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

  private _submit = (choice: string, comment: string) => {
    this.selectedChoice = choice
    this.comment = comment
    this.close()
  }
}
