import { Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ViewFormPanel.module.scss'
import { ViewFormPanelFooter } from './ViewFormPanelFooter'
import { useViewFormPanel } from './useViewFormPanel'

export const ViewFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { isEditing, onDismiss } = useViewFormPanel()

  return (
    <Panel
      isOpen={context.state.viewForm.isOpen}
      headerText={isEditing ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onRenderFooterContent={() => (
        <ViewFormPanelFooter />
      )}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <FormFieldContainer>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type='number'
          disabled={isEditing}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          disabled={isEditing}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.InternalNameLabel}
          description={strings.InternalNameDescription}
          required={true}
          disabled={isEditing}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.DisplayNameLabel}
          required={true}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.MinWidthLabel}
          description={strings.MinWidthDescription}
          type='number'
        />
      </FormFieldContainer>
      <FormFieldContainer description={strings.IsRefinableDescription}>
        <Toggle
          label={strings.IsRefinableLabel}
        />
      </FormFieldContainer>
      <FormFieldContainer description={strings.IsGroupableDescription}>
        <Toggle
          label={strings.IsGroupableLabel}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useViewFormPanel'
