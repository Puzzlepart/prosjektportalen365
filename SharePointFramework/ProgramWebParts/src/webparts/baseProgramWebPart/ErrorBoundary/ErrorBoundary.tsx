import * as strings from 'ProgramWebPartsStrings'
import { UserMessage } from 'pp365-shared-library'
import React, { Component, ReactNode } from 'react'
import { IErrorBoundaryProps, IErrorBoundaryState } from './types'

/**
 * Catches an error a program web part's component throws while it renders, as the portfolio and
 * project web parts' boundary does: the web part shows the error as the program web parts show a
 * configuration they could not read, where React would have emptied it, and `onError` lets the
 * base web part count the failure.
 *
 * A class: React 18 has no hook that catches a render error, and `react-error-boundary`, which
 * the other two solutions use, is not among this solution's dependencies.
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: IErrorBoundaryState = {}

  public static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { error }
  }

  public componentDidCatch(): void {
    this.props.onError()
  }

  public render(): ReactNode {
    if (!this.state.error) return this.props.children
    return <UserMessage title={strings.ErrorTitle} text={this.state.error.message} intent='error' />
  }
}
