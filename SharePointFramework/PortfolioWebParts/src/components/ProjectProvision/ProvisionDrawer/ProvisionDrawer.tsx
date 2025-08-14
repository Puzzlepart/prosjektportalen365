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
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer, customLightTheme, getFluentIcon, UserMessage } from 'pp365-shared-library'
import { SiteType } from './SiteType'
import { useProvisionDrawer } from './useProvisionDrawer'
import { useLocalInput } from './useLocalInput'
import styles from './ProvisionDrawer.module.scss'
import { UserMulti } from './User'
import { Guest } from './Guest'
import { ImageUpload } from './ImageUpload'
import { DebugModel } from './DebugModel'
import { IProvisionDrawerProps } from './types'
import { DayOfWeek, format } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/core'

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
    missingFieldsInfo,
    siteExists,
    setSiteExists,
    namingConvention,
    enableSensitivityLabels,
    enableSensitivityLabelsLibrary,
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    urlPrefix,
    aliasSuffix,
    joinHub,
    isTeam,
    getField,
    fluentProviderId
  } = useProvisionDrawer()

  // Local input hooks to prevent cursor jumping
  const nameInput = useLocalInput('name')
  const descriptionInput = useLocalInput('description')
  const justificationInput = useLocalInput('justification')
  const additionalInfoInput = useLocalInput('additionalInfo')

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
                      icon={getFluentIcon('ArrowLeft')}
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
                    icon={getFluentIcon('Dismiss')}
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
                {!stringIsNullOrEmpty(context.props.level0Header) && (
                  <DrawerHeaderTitle>{levels[0].title}</DrawerHeaderTitle>
                )}
                {!stringIsNullOrEmpty(context.props.level0Description) && (
                  <p>{levels[0].description}</p>
                )}
                <div className={styles.content}>
                  <FieldContainer
                    iconName='AppsList'
                    label={getField('type').displayName}
                    required={getField('type').required}
                    hidden={getField('type').hidden}
                  >
                    {context.props.siteTypeRenderMode !== 'dropdown' ? (
                      <div className={styles.sitetypes}>
                        {context.state.types?.map((type) => (
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
                        {context.state.types?.map((type) => (
                          <Option key={type.title} text={type.title} title={type.description}>
                            <Tag
                              className={styles.siteTag}
                              media={<img className={styles.siteImage} src={type.image?.Url} />}
                              appearance='outline'
                              size='medium'
                            >
                              <div className={styles.siteDropdown}>
                                <span>{type.title}</span>
                                <div className={styles.description}>{type.description}</div>
                              </div>
                            </Tag>
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label={getField('name').displayName}
                    required={getField('name').required}
                    hidden={getField('name').hidden}
                    validationState={
                      nameInput.value.length ? (siteExists ? 'error' : 'success') : 'none'
                    }
                    validationMessage={
                      nameInput.value.length
                        ? siteExists
                          ? strings.Provision.SiteNameValidationErrorMessage
                          : strings.Provision.SiteNameValidationSuccessMessage
                        : getField('name').description
                    }
                  >
                    <Input
                      value={nameInput.value}
                      onChange={async (_, data) => {
                        nameInput.onChange(data.value)

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
                    hidden={getField('description').hidden}
                  >
                    <Textarea
                      value={descriptionInput.value}
                      onChange={(_, data) => descriptionInput.onChange(data.value)}
                      rows={2}
                      placeholder={getField('description').placeholder}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={getField('justification').displayName}
                    description={getField('justification').description}
                    required={getField('justification').required}
                    hidden={getField('justification').hidden}
                  >
                    <Textarea
                      value={justificationInput.value}
                      onChange={(_, data) => justificationInput.onChange(data.value)}
                      rows={2}
                      placeholder={getField('justification').placeholder}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextAlignLeft'
                    label={getField('additionalInfo').displayName}
                    description={getField('additionalInfo').description}
                    required={getField('additionalInfo').required}
                    hidden={getField('additionalInfo').hidden}
                  >
                    <Textarea
                      value={additionalInfoInput.value}
                      onChange={(_, data) => additionalInfoInput.onChange(data.value)}
                      rows={2}
                      placeholder={getField('additionalInfo').placeholder}
                    />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='Person'
                    label={getField('owner').displayName}
                    description={getField('owner').description}
                    required={getField('owner').required}
                    hidden={getField('owner').hidden}
                  >
                    <UserMulti type='owner' />
                  </FieldContainer>
                  <FieldContainer
                    iconName='People'
                    label={getField('member').displayName}
                    description={getField('member').description}
                    required={getField('member').required}
                    hidden={getField('member').hidden}
                  >
                    {/* Members can not be the same as the owner */}
                    <UserMulti type='member' />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Person'
                    label={getField('requestedBy').displayName}
                    description={getField('requestedBy').description}
                    required={getField('requestedBy').required}
                    hidden={getField('requestedBy').hidden}
                  >
                    <UserMulti type='requestedBy' />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label={getField('alias').displayName}
                    hidden={getField('alias').hidden}
                  >
                    <Input
                      disabled
                      value={`${namingConvention?.prefixText}${context.column.get('alias')}${
                        namingConvention?.suffixText
                      }`}
                      contentAfter={<Tag size='small'>{aliasSuffix}</Tag>}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Link'
                    label={getField('url').displayName}
                    hidden={getField('url').hidden}
                  >
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
              {!stringIsNullOrEmpty(context.props.level1Header) && (
                <DrawerHeaderTitle>{levels[1].title}</DrawerHeaderTitle>
              )}
              {!stringIsNullOrEmpty(context.props.level1Description) && (
                <p>{levels[1].description}</p>
              )}
              <div className={styles.content}>
                <FieldContainer
                  iconName='PeopleTeam'
                  label={getField('teamify').displayName}
                  description={getField('teamify').description}
                  required={getField('teamify').required}
                  hidden={getField('teamify').hidden}
                >
                  <Switch
                    checked={context.column.get('teamify') || isTeam}
                    disabled={isTeam}
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
                  hidden={!context.column.get('teamify') || getField('teamTemplate').hidden}
                >
                  <Dropdown
                    value={context.column.get('teamTemplate')}
                    selectedOptions={[context.column.get('teamTemplate')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('teamTemplate', data.optionValue)
                    }}
                  >
                    {context.state.teamTemplates?.map((template) => (
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
                  hidden={getField('isConfidential').hidden}
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
                  hidden={getField('privacy').hidden}
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
                  hidden={getField('externalSharing').hidden || !enableExternalSharing}
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
                  hidden={
                    getField('externalSharing').hidden || !context.column.get('externalSharing')
                  }
                >
                  <Guest />
                </FieldContainer>
                <Divider />
                <FieldContainer
                  iconName='PeopleCommunity'
                  label={getField('sensitivityLabel').displayName}
                  description={getField('sensitivityLabel').description}
                  required={getField('sensitivityLabel').required}
                  hidden={getField('sensitivityLabel').hidden || !enableSensitivityLabels}
                >
                  <Dropdown
                    value={context.column.get('sensitivityLabel')}
                    selectedOptions={[context.column.get('sensitivityLabel')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('sensitivityLabel', data.optionValue)
                    }}
                  >
                    {context.state.sensitivityLabels?.map((label) => (
                      <Option key={label.title} value={label.title}>
                        {label.title}
                      </Option>
                    ))}
                  </Dropdown>
                </FieldContainer>
                <FieldContainer
                  iconName='Library'
                  label={getField('sensitivityLabelLibrary').displayName}
                  description={getField('sensitivityLabelLibrary').description}
                  required={getField('sensitivityLabelLibrary').required}
                  hidden={
                    getField('sensitivityLabelLibrary').hidden || !enableSensitivityLabelsLibrary
                  }
                >
                  <Dropdown
                    value={context.column.get('sensitivityLabelLibrary')}
                    selectedOptions={[context.column.get('sensitivityLabelLibrary')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('sensitivityLabelLibrary', data.optionValue)
                    }}
                  >
                    {context.state.sensitivityLabelsLibrary?.map((label) => (
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
                  hidden={getField('retentionLabel').hidden || !enableRetentionLabels}
                >
                  <Dropdown
                    value={context.column.get('retentionLabel')}
                    selectedOptions={[context.column.get('retentionLabel')]}
                    onOptionSelect={(_, data) => {
                      context.setColumn('retentionLabel', data.optionValue)
                    }}
                  >
                    {context.state.retentionLabels?.map((label) => (
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
                  hidden={getField('expirationDate').hidden || !enableExpirationDate}
                >
                  {context.props.expirationDateMode === 'date' ? (
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
                  ) : (
                    <Dropdown
                      defaultValue={strings.Provision.ExpirationDateNoneOption}
                      defaultSelectedOptions={['0']}
                      onOptionSelect={(_, data) => {
                        context.setColumn('expirationDate', data.optionValue)
                      }}
                    >
                      <Option value='0' text={strings.Provision.ExpirationDateNoneOption}>
                        {strings.Provision.ExpirationDateNoneOption}
                      </Option>
                      {[1, 3, 6, 12, 24].map((month) => {
                        return (
                          <Option
                            key={month.toString()}
                            value={month.toString()}
                            text={format(strings.Provision.ExpirationDateMonthOption, month)}
                          >
                            {format(strings.Provision.ExpirationDateMonthOption, month)}
                          </Option>
                        )
                      })}
                    </Dropdown>
                  )}
                </FieldContainer>
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
                {!stringIsNullOrEmpty(context.props.level2Header) && (
                  <DrawerHeaderTitle>{levels[2].title}</DrawerHeaderTitle>
                )}
                {!stringIsNullOrEmpty(context.props.level2Description) && (
                  <p>{levels[2].description}</p>
                )}
                <div className={styles.content}>
                  {context.props.debugMode || (DEBUG && <DebugModel />)}
                  <Divider />
                  <FieldContainer
                    iconName='PeopleAudience'
                    label={getField('readOnlyGroup').displayName}
                    description={getField('readOnlyGroup').description}
                    required={getField('readOnlyGroup').required}
                    hidden={getField('readOnlyGroup').hidden || !enableReadOnlyGroup}
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
                    hidden={getField('internalChannel').hidden || !enableInternalChannel}
                  >
                    <Switch
                      checked={context.column.get('internalChannel')}
                      value={context.column.get('internalChannel')}
                      onChange={(_, data) => {
                        context.setColumn('internalChannel', data.checked)
                      }}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Image'
                    label={getField('image').displayName}
                    description={getField('image').description}
                    required={getField('image').required}
                    hidden={getField('image').hidden}
                  >
                    <ImageUpload onImageUpload={(image) => context.setColumn('image', image)} />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='LocalLanguage'
                    label={getField('language').displayName}
                    hidden={getField('language').hidden}
                  >
                    <Dropdown
                      defaultValue={context.column.get('language')}
                      defaultSelectedOptions={[context.column.get('language')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Clock'
                    label={getField('timeZone').displayName}
                    hidden={getField('timeZone').hidden}
                  >
                    <Dropdown
                      defaultValue={context.column.get('timeZone')}
                      defaultSelectedOptions={[context.column.get('timeZone')]}
                      disabled
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Database'
                    label={getField('hubSiteTitle').displayName}
                    hidden={getField('hubSiteTitle').hidden || !joinHub}
                  >
                    <Dropdown
                      defaultValue={context.column.get('hubSiteTitle')}
                      defaultSelectedOptions={[context.column.get('hubSiteTitle')]}
                      disabled
                    />
                  </FieldContainer>
                  {!stringIsNullOrEmpty(context.props.footerDescription) && (
                    <p className={styles.ignoreGap}>{context.props.footerDescription}</p>
                  )}
                  {isSaveDisabled && missingFieldsInfo.missingFields.length > 0 && (
                    <UserMessage
                      intent='error'
                      title={strings.Provision.MissingFieldsTitle}
                      text={`<ul>
                          ${missingFieldsInfo.missingFields
                            .map((field) => `<li>${field.displayName}</li>`)
                            .join('')}
                        </ul>`}
                      containerStyle={{ marginTop: '16px' }}
                    />
                  )}
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
