import * as strings from 'PortfolioWebPartsStrings'
import { BasePanel, FieldContainer, UserMessage, customLightTheme } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'
import {
  FluentProvider,
  IdPrefixProvider,
  Input,
  Switch,
  Textarea
} from '@fluentui/react-components'

/** Edit or create a portfolio view's query, title, icon and sharing/default settings. */
export const ViewFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const {
    view,
    setView,
    isEditing,
    onDismiss,
    isDefaultViewSet,
    onSave,
    saveError,
    fluentProviderId,
    defaultViewWarningId
  } = useViewFormPanel()
  if (!context) return null
  return (
    <BasePanel
      open={context.state.viewForm.isOpen}
      headerText={isEditing ? strings.EditViewHeaderText : strings.NewViewHeaderText}
      footer={<ViewFormPanelFooter onSave={onSave} />}
      onClose={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.content}>
          {/* Only once a save is refused: a message bar announces itself as it mounts. */}
          {saveError && <UserMessage intent='error' title={strings.ErrorTitle} text={saveError} />}
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.SortOrderLabel}
            description={strings.SortOrderDescription}
          >
            <Input
              type='number'
              value={view.get('sortOrder')?.toString() ?? ''}
              // As text: with a min and a max, VoiceOver read the place in the range («58,3 %»).
              aria-valuetext={view.get('sortOrder')?.toString()}
              min={10}
              max={900}
              step={1}
              disabled={view.get('isDefaultView')}
              onChange={(_, data) => setView('sortOrder', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.TitleLabel}
            description={strings.TitleDescription}
            required={true}
          >
            <Input
              value={view.get('title') ?? ''}
              onChange={(_, data) => setView('title', data.value)}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='TextAlignLeft'
            label={strings.SearchQueryLabel}
            description={strings.PortfolioViewSearchQueryDescription}
            required={true}
          >
            <Textarea
              value={view.get('searchQuery') ?? ''}
              rows={12}
              placeholder={strings.Placeholder.TextField}
              onChange={(_, data) => setView('searchQuery', data.value)}
            />
          </FieldContainer>
          <FieldContainer
            iconName='Icons'
            label={strings.IconNameLabel}
            description={strings.IconNameDescription}
          >
            <Input
              value={view.get('iconName') ?? ''}
              onChange={(_, data) => setView('iconName', data.value)}
              placeholder={strings.Placeholder.Icon}
            />
          </FieldContainer>
          <FieldContainer
            iconName='PeopleCommunity'
            label={strings.DefaultViewLabel}
            description={strings.DefaultViewDescription}
            hidden={view.get('isPersonalView')}
          >
            {/* Focusable while it cannot be changed, and described by why (WCAG 2.1.1, 3.3.2): a
                disabled switch was skipped by Tab, and the warning read apart from it. */}
            <Switch
              checked={!!view.get('isDefaultView')}
              onChange={(_, data) => {
                if (!isDefaultViewSet) setView('isDefaultView', data.checked)
              }}
              aria-disabled={isDefaultViewSet || undefined}
              aria-describedby={isDefaultViewSet ? defaultViewWarningId : undefined}
            />
            {/* Only while the field shows: a message bar announces itself, hidden or not. */}
            {isDefaultViewSet && !view.get('isPersonalView') && (
              <div id={defaultViewWarningId}>
                <UserMessage
                  title={strings.DefaultViewLabel}
                  text={strings.DefaultViewSetWarningMessage}
                  intent='warning'
                />
              </div>
            )}
          </FieldContainer>
          <FieldContainer
            iconName='Person'
            label={strings.PersonalViewLabel}
            description={strings.PersonalViewDescription}
            hidden={view.get('isDefaultView')}
          >
            <Switch
              checked={!!view.get('isPersonalView')}
              onChange={(_, data) => setView('isPersonalView', data.checked)}
            />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </BasePanel>
  )
}

export * from './useViewFormPanel'
