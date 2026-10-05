// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The two sections have tests of their own; here they are lists
// of what the dialog has selected. Fluent's combobox family cannot be opened under jsdom on React
// 17 (it loops the Jest worker; see the testing guide), so the template picker is a native select
// that keeps Fluent's contract: choosing an option calls `onOptionSelect` with its value. A cloud
// template's package is resolved by `cloud.resolve`.
;(globalThis as any).DEBUG = false
const cloud: { resolve: jest.Mock } = { resolve: jest.fn() }
jest.mock('./resolveCloudTemplate', () => ({
  resolveCloudTemplate: (template: any) => cloud.resolve(template)
}))
jest.mock('./ExtensionsSection', () => {
  const React = jest.requireActual('react')
  const { useProjectSetupDialogContext } = jest.requireActual('./context')
  return {
    ExtensionsSection: () =>
      React.createElement(
        'ul',
        { 'aria-label': 'Valgte prosjekttillegg' },
        useProjectSetupDialogContext().state.selectedExtensions.map((item: any) =>
          React.createElement('li', { key: item.id }, item.text)
        )
      )
  }
})
jest.mock('./ContentConfigSection', () => {
  const React = jest.requireActual('react')
  const { useProjectSetupDialogContext } = jest.requireActual('./context')
  return {
    ContentConfigSection: () =>
      React.createElement(
        'ul',
        { 'aria-label': 'Valgt standardinnhold' },
        useProjectSetupDialogContext().state.selectedContentConfig.map((item: any) =>
          React.createElement('li', { key: item.id }, item.text)
        )
      )
  }
})
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const Combobox = ({ placeholder, disabled, selectedOptions, onOptionSelect, children }: any) =>
    React.createElement(
      'select',
      {
        'aria-label': placeholder,
        disabled,
        value: selectedOptions?.[0] ?? '',
        onChange: (event: any) => {
          const option = event.target.options[event.target.selectedIndex]
          onOptionSelect?.(event, {
            optionValue: option.value,
            optionText: option.textContent,
            selectedOptions: [option.value]
          })
        }
      },
      React.createElement('option', { value: '' }),
      children
    )
  const Option = ({ value, text, disabled }: any) =>
    React.createElement('option', { value, disabled }, text)
  return { __esModule: true, ...actual, Combobox, Option }
})

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import * as React from 'react'
import { ProjectSetupValidation } from '../../extensions/projectSetup/types'
import { ProjectSetupDialog } from './ProjectSetupDialog'
import { TEMPLATES, extension, setupData, template } from './testFixtures'

const CLOUD = template(3, 'Skymal', { isCloudTemplate: true })

function renderDialog(props: Record<string, any> = {}) {
  const onSubmit = jest.fn()
  const onDismiss = jest.fn()
  render(
    <ProjectSetupDialog
      data={setupData()}
      version='v1.15.0'
      onSubmit={onSubmit}
      onDismiss={onDismiss}
      {...props}
    />
  )
  return { onSubmit, onDismiss }
}

const picker = () => screen.getByLabelText(strings.ProjectTemplateSelectorSearchPlaceholder)
const submit = () => screen.getByText(strings.ProjectSetupDialogSubmitButtonText).closest('button')
const listed = (label: string) =>
  within(screen.getByLabelText(label))
    .queryAllByRole('listitem')
    .map((item) => item.textContent)

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ProjectSetupDialog', () => {
  it('preselects the default template with its extensions and list content, and sets up with them', () => {
    const { onSubmit } = renderDialog()
    expect(screen.getByText(strings.ProjectSetupDialogTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.ProjectSetupDialogInfoText)).toBeInTheDocument()
    expect(picker()).toHaveValue('1')
    expect(listed('Valgte prosjekttillegg')).toEqual(['Gevinstoversikt'])
    expect(
      screen.getByText(
        format(
          strings.TemplateConfigMessage,
          'Standardmal',
          `${strings.ExtensionsSectionHeaderText}${strings.TemplateConfigConjunction}${strings.ContentConfigSectionHeaderText}`.toLowerCase()
        )
      )
    ).toBeInTheDocument()
    fireEvent.click(submit())
    const [state] = onSubmit.mock.calls[0]
    expect(state.selectedTemplate.text).toBe('Standardmal')
    expect(state.selectedExtensions.map(({ text }) => text)).toEqual(['Gevinstoversikt'])
    expect(state.selectedContentConfig.map(({ text }) => text)).toEqual(['Fasesjekkliste'])
  })

  it("sets up with another template's selection once that template is chosen", () => {
    const { onSubmit } = renderDialog()
    fireEvent.change(picker(), { target: { value: '2' } })
    expect(listed('Valgte prosjekttillegg')).toEqual(['Risikomatrise'])
    fireEvent.click(
      screen.getByRole('tab', {
        name: (name) => name.includes(strings.ContentConfigSectionHeaderText)
      })
    )
    expect(listed('Valgt standardinnhold')).toEqual(['Fasesjekkliste', 'Planner'])
    fireEvent.click(submit())
    expect(onSubmit.mock.calls[0][0].selectedTemplate.text).toBe('Byggeprosjekt')
  })

  it('runs without a template on a project that has one, unless a template is chosen', () => {
    const { onSubmit } = renderDialog({ data: setupData({ hasExistingTemplate: true }) })
    expect(screen.getByLabelText(strings.ProjectTemplateSelectorNoTemplateRadioLabel)).toBeChecked()
    expect(screen.queryByLabelText(strings.ProjectTemplateSelectorSearchPlaceholder)).toBeNull()
    fireEvent.click(submit())
    expect(onSubmit.mock.calls[0][0].selectedTemplate.text).toBe(
      strings.ProjectTemplateSelectorNoTemplateLabel
    )
    fireEvent.click(screen.getByLabelText(strings.ProjectTemplateSelectorSelectTemplateRadioLabel))
    expect(picker()).toHaveValue('1')
  })

  it('cannot set up a project without a template to choose', () => {
    renderDialog({ data: setupData({ templates: [] }) })
    expect(submit()).toBeDisabled()
  })

  it('says which steps it is configured to run', () => {
    renderDialog({ tasks: ['SitePermissions', 'ApplyTemplate'] })
    expect(screen.getByText(strings.ConfiguredSpecifiedTaskTitle)).toBeInTheDocument()
    expect(
      screen.getByText(
        format(strings.ConfiguredSpecifiedTaskMessage, 'SitePermissions, ApplyTemplate')
      )
    ).toBeInTheDocument()
  })

  it('says when project data was found for the project', () => {
    renderDialog({ data: setupData({ projectData: { Title: 'Frisbeegolfbane' } }) })
    expect(screen.getByText(strings.ProjectDataFoundTitle)).toBeVisible()
  })

  it('leaves the project data message hidden when there is none', () => {
    renderDialog()
    expect(screen.getByText(strings.ProjectDataFoundTitle)).not.toBeVisible()
  })

  it('warns that Planner needs membership of the group', () => {
    renderDialog({ validation: ProjectSetupValidation.UserNotGroupMember })
    expect(screen.getByText(strings.PlannerMemberWarningMessage)).toBeInTheDocument()
  })

  it('closes', () => {
    const { onDismiss } = renderDialog()
    fireEvent.click(screen.getByText(strings.CloseModalText))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('sets up from a cloud template once its package has been read', async () => {
    cloud.resolve.mockImplementation(() =>
      Promise.resolve({
        templateId: 3,
        package: { manifest: { cloudCompatible: true } },
        extensions: [extension(5, 'Skytillegg')],
        contentConfig: []
      })
    )
    const { onSubmit } = renderDialog({ data: setupData({ templates: [...TEMPLATES, CLOUD] }) })
    fireEvent.change(picker(), { target: { value: '3' } })
    expect(screen.getByText(strings.CloudTemplateResolvingMessage)).toBeInTheDocument()
    expect(submit()).toBeDisabled()
    expect(await screen.findByText('Skytillegg')).toBeInTheDocument()
    expect(cloud.resolve).toHaveBeenCalledWith(CLOUD)
    fireEvent.click(submit())
    expect(onSubmit.mock.calls[0][0].resolvedCloudTemplate.templateId).toBe(3)
  })

  it('warns when a cloud template holds content this hub cannot take', async () => {
    cloud.resolve.mockImplementation(() =>
      Promise.resolve({
        templateId: 3,
        package: { manifest: { cloudCompatible: false } },
        extensions: [],
        contentConfig: []
      })
    )
    renderDialog({ data: setupData({ templates: [...TEMPLATES, CLOUD] }) })
    fireEvent.change(picker(), { target: { value: '3' } })
    expect(
      await screen.findByText(format(strings.CloudTemplateNotCompatibleWarning, 'Skymal'))
    ).toBeInTheDocument()
  })

  it('says so when a cloud template cannot be read', async () => {
    cloud.resolve.mockImplementation(() => Promise.reject(new Error('404')))
    renderDialog({ data: setupData({ templates: [...TEMPLATES, CLOUD] }) })
    fireEvent.change(picker(), { target: { value: '3' } })
    expect(await screen.findByText(strings.CloudTemplateResolveErrorMessage)).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })
})
