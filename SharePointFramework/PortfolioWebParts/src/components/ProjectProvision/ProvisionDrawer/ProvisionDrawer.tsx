import React, { FC } from 'react'
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderNavigation,
  ToolbarGroup,
  ToolbarButton,
  mergeClasses,
  DrawerBody,
  DrawerHeaderTitle,
  Input,
  Textarea,
  Divider,
  Switch,
  DrawerFooter,
  Toolbar,
  Dropdown,
  Button,
  Tag,
  Tooltip,
  Toast,
  ToastBody,
  ToastTitle,
  IdPrefixProvider,
  Option,
  FluentProvider
} from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import { ArrowLeft24Regular, Dismiss24Regular } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer, customLightTheme } from 'pp365-shared-library'
import { SiteType } from './SiteType'
import { useProvisionDrawer } from './useProvisionDrawer'
import styles from './ProvisionDrawer.module.scss'
import { UserMulti } from './User'
import { Guest } from './Guest'
import { ImageUpload } from './ImageUpload'
import { DebugModel } from './DebugModel'
import { IProvisionDrawerProps } from './types'
import { DayOfWeek } from '@fluentui/react'

export const ProvisionDrawer: FC<IProvisionDrawerProps> = (props) => {
  const {
    levels,
    currentLevel,
    setCurrentLevel,
    toolbarBackIconMotion,
    levelMotions,
    motionStyles,
    context,
    onSave,
    isSaveDisabled,
    siteExists,
    setSiteExists,
    namingConvention,
    enableSensitivityLabels,
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    urlPrefix,
    aliasSuffix,
    getField,
    fluentProviderId
  } = useProvisionDrawer()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          open={context.state.showProvisionDrawer}
          size='medium'
          onOpenChange={(_, { open }) => context.setState({ showProvisionDrawer: open })}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation>
              <Toolbar className={styles.toolbar}>
                <ToolbarGroup>
                  {toolbarBackIconMotion.canRender && (
                    <ToolbarButton
                      ref={toolbarBackIconMotion.ref}
                      className={mergeClasses(
                        motionStyles.toolbarButton,
                        toolbarBackIconMotion.active && motionStyles.toolbarButtonVisible
                      )}
                      title={strings.Aria.Back}
                      appearance='subtle'
                      icon={<ArrowLeft24Regular />}
                      onClick={() => setCurrentLevel(currentLevel - 1)}
                    />
                  )}
                </ToolbarGroup>
                <ToolbarGroup>
                  {/* {toolbarCalendarIconMotion.canRender && (
                    <ToolbarButton
                      ref={toolbarCalendarIconMotion.ref}
                      className={mergeClasses(
                        motionStyles.toolbarButton,
                        toolbarCalendarIconMotion.active && motionStyles.toolbarButtonVisible
                      )}
                      appearance='subtle'
                      icon={<DataUsage24Regular />}
                      onClick={() => setCurrentLevel(1)}
                    />
                  )}

                  <ToolbarButton
                    appearance='subtle'
                    title={strings.Aria.Settings}
                    icon={<Settings24Regular />}
                  /> */}
                  <ToolbarButton
                    title={strings.Aria.Close}
                    appearance='subtle'
                    icon={<Dismiss24Regular />}
                    onClick={() => context.setState({ showProvisionDrawer: false })}
                  />
                </ToolbarGroup>
              </Toolbar>
            </DrawerHeaderNavigation>
          </DrawerHeader>
          <div className={styles.body}>
            {levelMotions[0].canRender && (
              <DrawerBody
                ref={levelMotions[0].ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level0,
                  motionStyles.level0,
                  levelMotions[0].active && motionStyles.levelVisible
                )}
              >
                <DrawerHeaderTitle>{levels[0].title}</DrawerHeaderTitle>
                <p>{levels[0].description}</p>
                <div className={styles.content}>
                  <FieldContainer
                    iconName='AppsList'
                    label={getField('type').displayName}
                    required={getField('type').required}
                  >
                    {context.props.siteTypeRenderMode !== 'dropdown' ? (
                      <div className={styles.sitetypes}>
                        {context.state.types.map((type) => (
                          <SiteType
                            key={type.title}
                            title={type.title}
                            description={type.description}
                            image={type.image?.Url}
                          />
                        ))}
                      </div>
                    ) : (
                      <Dropdown
                        value={context.column.get('type')}
                        selectedOptions={[context.column.get('type')]}
                        onOptionSelect={(_, data) => {
                          context.setColumn('type', data.optionValue)
                        }}
                      >
                        {context.state.types.map((type) => (
                          <Option key={type.title} value={type.title}>
                            {type.title}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label={getField('name').displayName}
                    required={getField('name').required}
                    validationState={
                      context.column.get('name').length
                        ? siteExists
                          ? 'error'
                          : 'success'
                        : 'none'
                    }
                    validationMessage={
                      context.column.get('name').length
                        ? siteExists
                          ? strings.Provision.SiteNameValidationErrorMessage
                          : strings.Provision.SiteNameValidationSuccessMessage
                        : getField('name').description
                    }
                  >
                    <Input
                      value={context.column.get('name')}
                      onChange={async (_, data) => {
                        context.setColumn('name', data.value)

                        if (data.value) {
                          setTimeout(async () => {
                            const value = data.value
                              .replace(/ /g, '')
                              .replace(/[^a-z-A-Z0-9-]/g, '')

                            const alias = `${namingConvention?.prefixText}${value}${namingConvention?.suffixText}`

                            setSiteExists(
                              await context.props.dataAdapter.siteExists(`${urlPrefix}${alias}`)
                            )
                          }, 500)
                        }
                      }}
                      contentBefore={
                        namingConvention?.prefixText && (
                          <Tooltip
                            withArrow
                            content={strings.Provision.SiteNamePrefixTooltipText}
                            relationship='label'
                          >
                            <Tag size='small'>{namingConvention?.prefixText}</Tag>
                          </Tooltip>
                        )
                      }
                      contentAfter={
                        namingConvention?.suffixText && (
                          <Tooltip
                            withArrow
                            content={strings.Provision.SiteNameSuffixTooltipText}
                            relationship='label'
                          >
                            <Tag size='small'>{namingConvention?.suffixText}</Tag>
                          </Tooltip>
                        )
                      }
                      placeholder={getField('name').placeholder}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={getField('description').displayName}
                    description={getField('description').description}
                    required={getField('description').required}
                  >
                    <Textarea
                      value={context.column.get('description')}
                      onChange={(_, data) => context.setColumn('description', data.value)}
                      rows={2}
                      placeholder={getField('description').placeholder}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={getField('justification').displayName}
                    description={getField('justification').description}
                    required={getField('justification').required}
                  >
                    <Textarea
                      value={context.column.get('justification')}
                      onChange={(_, data) => context.setColumn('justification', data.value)}
                      rows={2}
                      placeholder={strings.Placeholder.BusinessJustificationField}
                    />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='Person'
                    label={getField('owner').displayName}
                    description={getField('owner').description}
                    required={getField('owner').required}
                  >
                    <UserMulti type='owner' />
                  </FieldContainer>
                  <FieldContainer
                    iconName='People'
                    label={getField('member').displayName}
                    description={getField('member').description}
                    required={getField('member').required}
                  >
                    {/* Members can not be the same as the owner */}
                    <UserMulti type='member' />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Person'
                    label={getField('requestedBy').displayName}
                    description={getField('requestedBy').description}
                    required={getField('requestedBy').required}
                  >
                    <UserMulti type='requestedBy' />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer iconName='TextNumberFormat' label={getField('alias').displayName}>
                    <Input
                      disabled
                      value={`${namingConvention?.prefixText}${context.column.get('alias')}${
                        namingConvention?.suffixText
                      }`}
                      contentAfter={<Tag size='small'>{aliasSuffix}</Tag>}
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Link' label={getField('url').displayName}>
                    <Input
                      disabled
                      value={`${namingConvention?.prefixText}${context.column.get('alias')}${
                        namingConvention?.suffixText
                      }`}
                      contentBefore={<Tag size='small'>{urlPrefix}</Tag>}
                    />
                  </FieldContainer>
                </div>
              </DrawerBody>
            )}
            <DrawerBody
              ref={levelMotions[1].ref}
              className={mergeClasses(
                styles.level,
                motionStyles.level,
                currentLevel === 2 ? motionStyles.level1a : motionStyles.level1,
                levelMotions[1].active && motionStyles.levelVisible
              )}
            >
              <DrawerHeaderTitle>{levels[1].title}</DrawerHeaderTitle>
              <p>{levels[1].description}</p>
              <div className={styles.content}>
                <FieldContainer
                  iconName='PeopleTeam'
                  label={getField('teamify').displayName}
                  description={getField('teamify').description}
                  required={getField('teamify').required}
                >
                  <Switch
                    checked={context.column.get('teamify')}
                    value={context.column.get('teamify')}
                    onChange={(_, data) => {
                      context.setColumn('teamify', data.checked)
                    }}
                  />
                </FieldContainer>
                <FieldContainer
                  iconName='PeopleAudience'
                  label={getField('teamTemplate').displayName}
                  description={getField('teamTemplate').description}
                  required={getField('teamTemplate').required}
                  hidden={!context.column.get('teamify')}
                >
                  <Dropdown
                    value={context.column.get('teamTemplate')}
                    selectedOptions={[context.column.get('teamTemplate')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('teamTemplate', data.optionValue)
                    }}
                  >
                    {context.state.teamTemplates.map((template) => (
                      <Option key={template.title} value={template.title}>
                        {template.title}
                      </Option>
                    ))}
                  </Dropdown>
                </FieldContainer>
                <Divider />
                <FieldContainer
                  iconName='BoxToolbox'
                  label={getField('isConfidential').displayName}
                  description={getField('isConfidential').description}
                  required={getField('isConfidential').required}
                >
                  <Switch
                    checked={context.column.get('isConfidential')}
                    value={context.column.get('isConfidential')}
                    onChange={(_, data) => {
                      context.setColumn('isConfidential', data.checked)

                      if (data.checked) {
                        context.setColumn('privacy', strings.Provision.PrivacyFieldOptionPrivate)
                      }
                    }}
                  />
                </FieldContainer>
                <FieldContainer
                  iconName='Eye'
                  label={getField('privacy').displayName}
                  description={getField('privacy').description}
                  required={getField('privacy').required}
                >
                  <Dropdown
                    selectedOptions={[context.column.get('privacy')]}
                    value={context.column.get('privacy')}
                    onOptionSelect={(_, data) => {
                      context.setColumn('privacy', data.optionValue)
                    }}
                    disabled={context.column.get('isConfidential')}
                  >
                    <Option value={strings.Provision.PrivacyFieldOptionPrivate}>
                      {strings.Provision.PrivacyFieldOptionPrivate}
                    </Option>
                    <Option value={strings.Provision.PrivacyFieldOptionPublic}>
                      {strings.Provision.PrivacyFieldOptionPublic}
                    </Option>
                  </Dropdown>
                </FieldContainer>
                <FieldContainer
                  iconName='Guest'
                  label={getField('externalSharing').displayName}
                  description={getField('externalSharing').description}
                  required={getField('externalSharing').required}
                  hidden={!enableExternalSharing}
                >
                  <Switch
                    checked={context.column.get('externalSharing')}
                    value={context.column.get('externalSharing')}
                    onChange={(_, data) => {
                      context.setColumn('externalSharing', data.checked)

                      if (!data.checked) {
                        context.setColumn('guest', [])
                      }
                    }}
                  />
                </FieldContainer>
                <FieldContainer
                  iconName='People'
                  label={getField('guest').displayName}
                  description={getField('guest').description}
                  required={getField('guest').required}
                  hidden={!context.column.get('externalSharing')}
                >
                  <Guest />
                </FieldContainer>
                <Divider />
                <FieldContainer
                  iconName='PeopleCommunity'
                  label={getField('sensitivityLabel').displayName}
                  description={getField('sensitivityLabel').description}
                  required={getField('sensitivityLabel').required}
                >
                  <Dropdown
                    disabled={!enableSensitivityLabels}
                    value={context.column.get('sensitivityLabel')}
                    selectedOptions={[context.column.get('sensitivityLabel')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('sensitivityLabel', data.optionValue)
                    }}
                  >
                    {context.state.sensitivityLabels.map((label) => (
                      <Option key={label.title} value={label.title}>
                        {label.title}
                      </Option>
                    ))}
                  </Dropdown>
                </FieldContainer>
                <FieldContainer
                  iconName='Checkmark'
                  label={getField('retentionLabel').displayName}
                  description={getField('retentionLabel').description}
                  required={getField('retentionLabel').required}
                >
                  <Dropdown
                    disabled={!enableRetentionLabels}
                    value={context.column.get('retentionLabel')}
                    selectedOptions={[context.column.get('retentionLabel')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('retentionLabel', data.optionValue)
                    }}
                  >
                    {context.state.retentionLabels.map((label) => (
                      <Option key={label.title} value={label.title}>
                        {label.title}
                      </Option>
                    ))}
                  </Dropdown>
                </FieldContainer>
                <FieldContainer
                  iconName='Calendar'
                  label={getField('expirationDate').displayName}
                  description={getField('expirationDate').description}
                  required={getField('expirationDate').required}
                  hidden={!enableExpirationDate}
                >
                  <DatePicker
                    value={context.column.get('expirationDate')}
                    onSelectDate={(date) => context.setColumn('expirationDate', date)}
                    formatDate={(date) => date.toLocaleDateString()}
                    placeholder={strings.Placeholder.DatePicker}
                    firstDayOfWeek={DayOfWeek.Monday}
                    showWeekNumbers
                    allowTextInput
                    showMonthPickerAsOverlay={false}
                  />
                </FieldContainer>
                <FieldContainer iconName='LocalLanguage' label={getField('language').displayName}>
                  <Dropdown
                    defaultValue={context.column.get('language')}
                    defaultSelectedOptions={[context.column.get('language')]}
                    disabled
                  />
                </FieldContainer>
                <FieldContainer iconName='Clock' label={getField('timeZone').displayName}>
                  <Dropdown
                    defaultValue={context.column.get('timeZone')}
                    defaultSelectedOptions={[context.column.get('timeZone')]}
                    disabled
                  />
                </FieldContainer>
                <FieldContainer iconName='Database' label={getField('hubSiteTitle').displayName}>
                  <Dropdown
                    defaultValue={context.column.get('hubSiteTitle')}
                    defaultSelectedOptions={[context.column.get('hubSiteTitle')]}
                    disabled
                  />
                </FieldContainer>
                <p className={styles.ignoreGap}>{strings.Provision.DrawerFooterDescriptionText}</p>
              </div>
            </DrawerBody>
            {levelMotions[2].canRender && (
              <DrawerBody
                ref={levelMotions[2].ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level2,
                  levelMotions[2].active && motionStyles.levelVisible
                )}
              >
                <DrawerHeaderTitle>{levels[2].title}</DrawerHeaderTitle>
                <p>{levels[2].description}</p>
                <div className={styles.content}>
                  {context.props.debugMode || (DEBUG && <DebugModel />)}
                  <Divider />
                  <FieldContainer
                    iconName='Image'
                    label={getField('image').displayName}
                    description={getField('image').description}
                    required={getField('image').required}
                  >
                    <ImageUpload onImageUpload={(image) => context.setColumn('image', image)} />
                  </FieldContainer>
                  <FieldContainer
                    iconName='PeopleAudience'
                    label={getField('readOnlyGroup').displayName}
                    description={getField('readOnlyGroup').description}
                    required={getField('readOnlyGroup').required}
                    hidden={!enableReadOnlyGroup}
                  >
                    <Switch
                      checked={context.column.get('readOnlyGroup')}
                      value={context.column.get('readOnlyGroup')}
                      onChange={(_, data) => {
                        context.setColumn('readOnlyGroup', data.checked)
                      }}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='PeopleTeam'
                    label={getField('internalChannel').displayName}
                    description={getField('internalChannel').description}
                    required={getField('internalChannel').required}
                    hidden={!enableInternalChannel}
                  >
                    <Switch
                      checked={context.column.get('internalChannel')}
                      value={context.column.get('internalChannel')}
                      onChange={(_, data) => {
                        context.setColumn('internalChannel', data.checked)
                      }}
                    />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer iconName='LocalLanguage' label={getField('language').displayName}>
                    <Dropdown
                      defaultValue={context.column.get('language')}
                      defaultSelectedOptions={[context.column.get('language')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Clock' label={getField('timeZone').displayName}>
                    <Dropdown
                      defaultValue={context.column.get('timeZone')}
                      defaultSelectedOptions={[context.column.get('timeZone')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer iconName='Database' label={getField('hubSiteTitle').displayName}>
                    <Dropdown
                      defaultValue={context.column.get('hubSiteTitle')}
                      defaultSelectedOptions={[context.column.get('hubSiteTitle')]}
                      disabled
                    />
                  </FieldContainer>
                  <p className={styles.ignoreGap}>
                    {strings.Provision.DrawerFooterDescriptionText}
                  </p>
                </div>
              </DrawerBody>
            )}
          </div>
          <DrawerFooter className={styles.footer}>
            <Button
              appearance='subtle'
              disabled={currentLevel === 0}
              onClick={() => setCurrentLevel(currentLevel - 1)}
            >
              {strings.Provision.PreviousButtonLabel}
            </Button>
            <Button
              appearance='primary'
              disabled={currentLevel === levels.length - 1 && isSaveDisabled}
              onClick={() => {
                currentLevel === levels.length - 1
                  ? onSave().then((response) => {
                      if (response) {
                        context.reset()
                        props.toast(
                          <Toast appearance='inverted'>
                            <ToastTitle>{strings.Provision.ToastCreatedTitle}</ToastTitle>
                            <ToastBody>{strings.Provision.ToastCreatedBody}</ToastBody>
                          </Toast>,
                          { intent: 'success' }
                        )
                        context.setState({ showProvisionDrawer: false, properties: {} })
                        setCurrentLevel(0)
                      } else {
                        props.toast(
                          <Toast appearance='inverted'>
                            <ToastTitle>{strings.Provision.ToastCreatedErrorTitle}</ToastTitle>
                            <ToastBody>{strings.Provision.ToastCreatedErrorBody}</ToastBody>
                          </Toast>,
                          { intent: 'error' }
                        )
                      }
                    })
                  : setCurrentLevel(currentLevel + 1)
              }}
            >
              {currentLevel === levels.length - 1
                ? strings.Provision.ProvisionButtonLabel
                : strings.Provision.NextButtonLabel}
            </Button>
          </DrawerFooter>
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
