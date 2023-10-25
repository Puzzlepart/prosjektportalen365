/* eslint-disable max-classes-per-file */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog'
import { DialogFooter, DialogContent, DialogType, format } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import { UserMessage } from 'pp365-shared-library/lib/components/UserMessage'
import { Button, Field, Textarea, Option, Dropdown } from '@fluentui/react-components'

interface IIdeaApprovalDialogContentProps {
  close: () => void
  submit: (choice: string, comment: string) => void
  ideaTitle?: string
  dialogDescription?: string
}

interface IIdeaApprovalDialogContentState {
  choice: string
  comment: string
}

class IdeaApprovalDialog extends React.Component<
  IIdeaApprovalDialogContentProps,
  IIdeaApprovalDialogContentState
> {
  constructor(props: IIdeaApprovalDialogContentProps | Readonly<IIdeaApprovalDialogContentProps>) {
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
          intent='info'
        />
        <Field label={strings.ActionLabel}>
          <Dropdown
            onOptionSelect={(_, data) => this.setState({ choice: data.optionText })}
            placeholder={strings.ActionLabelPlaceholder}
          >
            <Option value={strings.ApproveChoice}>{strings.ApproveChoice}</Option>
            <Option value={strings.ConsiderationChoice}>{strings.ConsiderationChoice}</Option>
            <Option value={strings.RejectChoice}>{strings.RejectChoice}</Option>
          </Dropdown>
        </Field>
        <Field label={strings.CommentLabel}>
          <Textarea
            rows={3}
            placeholder={strings.CommentLabelPlaceholder}
            onChange={(_, { value }) => this.setState({ comment: value })}
          />
        </Field>
        <DialogFooter>
          <Button title={strings.CancelLabel} onClick={this.props.close}>
            {strings.CancelLabel}
          </Button>
          <Button
            appearance='primary'
            title={strings.SubmitLabel}
            onClick={() => {
              this.props.submit(this.state.choice, this.state.comment)
            }}
            disabled={this.state.comment.length > 0 && this.state.choice.length > 0 ? false : true}
          >
            {strings.SubmitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    )
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
      <IdeaApprovalDialog
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
