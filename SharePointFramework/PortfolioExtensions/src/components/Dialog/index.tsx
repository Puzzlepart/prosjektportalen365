import * as React from 'react'
import {
  PrimaryButton,
  DialogFooter,
  DialogContent,
  DefaultButton,
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

export default class DialogPrompt extends React.Component<
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
        title='Opprett prosjektdata for idéen'
        subText={`Dette vil opprette et element i prosjektdata for følgende idé: ${this.props.ideaTitle}`}
        onDismiss={this.props.close}
        showCloseButton={true}
      >
        <DialogFooter>
          <DefaultButton
            text='Avbryt'
            title='Avbryt'
            onClick={this.props.close}
          />
          <PrimaryButton
            text='Opprett'
            title='Opprett'
            onClick={() => {
              this.props.submit(this.state.choice, this.state.comment)
            }}
            disabled={this.state.comment.length > 0 && this.state.choice.length > 0 ? false : true}
          />
        </DialogFooter>
      </DialogContent>
    )
  }
}
