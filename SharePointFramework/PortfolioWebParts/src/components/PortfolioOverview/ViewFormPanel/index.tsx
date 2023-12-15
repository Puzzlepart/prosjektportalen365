import { Panel } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FieldContainer, UserMessage, customLightTheme } from 'pp365-shared-library'
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
  Textarea,
  useId
} from '@fluentui/react-components'

export const ViewFormPanel: FC = () => {
  const fluentProviderId = useId('fp-view-form-panel')
  const context = useContext(PortfolioOverviewContext)
  const { view, setView, isEditing, onDismiss, isDefaultViewSet, onSave } = useViewFormPanel()
  return (
    <Panel
      isOpen={context.state.viewForm.isOpen}
      headerText={isEditing ? strings.EditViewHeaderText : strings.NewViewHeaderText}
      onRenderFooterContent={() => <ViewFormPanelFooter onSave={onSave} />}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.content}>
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.SortOrderLabel}
            description={strings.SortOrderLabel}
          >
            <Input
              type='number'
              defaultValue={view.get('sortOrder')?.toString()}
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
            description={strings.TitleLabel}
            required={true}
          >
            <Input
              value={view.get('title')}
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
              defaultValue={view.get('searchQuery')}
              rows={12}
              placeholder={strings.Placeholder.TextField}
              onBlur={(event) => setView('searchQuery', event.target.value)}
            />
          </FieldContainer>
          <FieldContainer
            iconName='Icons'
            label={strings.IconNameLabel}
            description={strings.IconNameDescription}
            required={true}
          >
            <Input
              value={view.get('iconName')}
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
            <Switch
              defaultChecked={view.get('isDefaultView')}
              onChange={(_, data) => setView('isDefaultView', data.checked)}
              disabled={isDefaultViewSet}
            />
            {isDefaultViewSet && (
              <UserMessage
                title={strings.DefaultViewLabel}
                text={strings.DefaultViewSetWarningMessage}
                intent='warning'
              />
            )}
          </FieldContainer>
          <FieldContainer
            iconName='Person'
            label={strings.PersonalViewLabel}
            description={strings.PersonalViewDescription}
            hidden={view.get('isDefaultView')}
          >
            <Switch
              defaultChecked={view.get('isPersonalView')}
              onChange={(_, data) => setView('isPersonalView', data.checked)}
            />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </Panel>
  )
}

export * from './useViewFormPanel'
