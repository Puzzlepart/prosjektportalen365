import React, { useContext } from 'react'
import { Input, Switch, Dropdown, Option, Tag, Tooltip } from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import { DayOfWeek, format } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer } from 'pp365-shared-library'
import { ProjectProvisionContext } from '../../context'
import { SiteType } from '../SiteType'
import { IFieldConfig } from './types'
import drawerStyles from '../ProvisionDrawer.module.scss'

interface LocalInputHandle {
  value: string
  onChange: (value: string) => void
}

export interface UseFieldConfigsParams {
  siteExists: boolean
  setSiteExists: (exists: boolean) => void
  duplicateOwnerMembers: any[]
  namingConvention: any
  urlPrefix: string
  aliasSuffix: string
  isTeam: boolean
  joinHub: boolean
  usesDifferentHub: boolean
  enableSensitivityLabels: any
  enableSensitivityLabelsLibrary: any
  enableRetentionLabels: any
  enableExpirationDate: any
  enableReadOnlyGroup: any
  enableInternalChannel: any
  enableExternalSharing: any
  getField: (fieldName: string) => any
  localInputs: {
    name: LocalInputHandle
    description: LocalInputHandle
    justification: LocalInputHandle
    additionalInfo: LocalInputHandle
  }
}

export function useFieldConfigs(params: UseFieldConfigsParams): Record<string, IFieldConfig> {
  const context = useContext(ProjectProvisionContext)
  const {
    name: nameInput,
    description: descriptionInput,
    justification: justificationInput,
    additionalInfo: additionalInfoInput
  } = params.localInputs

  const configs: Record<string, IFieldConfig> = {}

  configs.type = {
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        required={field.required}
        hidden={field.hidden}
      >
        {context.props.siteTypeRenderMode !== 'dropdown' ? (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'wrap' }}>
            {context.state.types?.map((type: any) => (
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
            onOptionSelect={(_, data) => context.setColumn('type', data.optionValue)}
          >
            {context.state.types?.map((type: any) => (
              <Option key={type.title} text={type.title} title={type.description}>
                <Tag
                  className={drawerStyles.siteTag}
                  media={
                    type.image?.Url && (
                      <img
                        className={drawerStyles.siteImage}
                        src={type.image.Url}
                        alt={type.title}
                      />
                    )
                  }
                  appearance='outline'
                  size='medium'
                >
                  <div className={drawerStyles.siteDropdown}>
                    <span>{type.title}</span>
                    <div className={drawerStyles.description}>{type.description}</div>
                  </div>
                </Tag>
              </Option>
            ))}
          </Dropdown>
        )}
      </FieldContainer>
    )
  }

  configs.name = {
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        required={field.required}
        hidden={field.hidden}
        validationState={
          nameInput.value.length ? (params.siteExists ? 'error' : 'success') : 'none'
        }
        validationMessage={
          nameInput.value.length
            ? params.siteExists
              ? strings.Provision.SiteNameValidationErrorMessage
              : strings.Provision.SiteNameValidationSuccessMessage
            : field.description
        }
      >
        <Input
          value={nameInput.value}
          onChange={async (_, data) => {
            const limitedValue = data.value.substring(0, 255)
            nameInput.onChange(limitedValue)
            if (limitedValue) {
              setTimeout(async () => {
                const value = limitedValue.replace(/ /g, '').replace(/[^a-z-A-Z0-9-]/g, '')
                const alias = `${params.namingConvention?.prefixText}${value}${params.namingConvention?.suffixText}`
                params.setSiteExists(
                  await context.props.dataAdapter.siteExists(`${params.urlPrefix}${alias}`)
                )
              }, 500)
            }
          }}
          contentBefore={
            params.namingConvention?.prefixText && (
              <Tooltip
                withArrow
                content={strings.Provision.SiteNamePrefixTooltipText}
                relationship='label'
              >
                <Tag size='small'>{params.namingConvention?.prefixText}</Tag>
              </Tooltip>
            )
          }
          contentAfter={
            <>
              {params.namingConvention?.suffixText && (
                <Tooltip
                  withArrow
                  content={strings.Provision.SiteNameSuffixTooltipText}
                  relationship='label'
                >
                  <Tag size='small'>{params.namingConvention?.suffixText}</Tag>
                </Tooltip>
              )}
              {nameInput.value.length >= 200 && (
                <span
                  style={{
                    fontSize: '12px',
                    color:
                      nameInput.value.length > 255
                        ? 'var(--colorPaletteRedForeground1)'
                        : 'var(--colorNeutralForeground3)',
                    marginLeft: params.namingConvention?.suffixText ? '8px' : '0'
                  }}
                >
                  {nameInput.value.length}/255
                </span>
              )}
            </>
          }
          placeholder={field.placeholder}
        />
      </FieldContainer>
    )
  }

  configs.description = {
    inputProps: {
      value: descriptionInput.value,
      onChange: (_: any, data: any) => descriptionInput.onChange(data.value)
    }
  }

  configs.justification = {
    inputProps: {
      value: justificationInput.value,
      onChange: (_: any, data: any) => justificationInput.onChange(data.value)
    }
  }

  configs.additionalInfo = {
    inputProps: {
      value: additionalInfoInput.value,
      onChange: (_: any, data: any) => additionalInfoInput.onChange(data.value)
    }
  }

  configs.member = {
    validationState: params.duplicateOwnerMembers.length > 0 ? 'error' : 'none',
    validationMessage:
      params.duplicateOwnerMembers.length > 0
        ? strings.Provision.DuplicateOwnerMemberMessage
        : undefined
  }

  configs.alias = {
    onRender: (field) => (
      <FieldContainer iconName={field.iconName} label={field.displayName} hidden={field.hidden}>
        <Tooltip
          withArrow
          content={`${params.namingConvention?.prefixText}${context.column.get('alias')}${
            params.namingConvention?.suffixText
          }${params.aliasSuffix}`}
          relationship='label'
        >
          <Input
            disabled
            value={`${params.namingConvention?.prefixText}${context.column.get('alias')}${
              params.namingConvention?.suffixText
            }`}
            contentAfter={<Tag size='small'>{params.aliasSuffix}</Tag>}
          />
        </Tooltip>
      </FieldContainer>
    )
  }

  configs.url = {
    onRender: (field) => (
      <FieldContainer iconName={field.iconName} label={field.displayName} hidden={field.hidden}>
        <Tooltip
          withArrow
          content={`${params.urlPrefix}${params.namingConvention?.prefixText}${context.column.get(
            'alias'
          )}${params.namingConvention?.suffixText}`}
          relationship='label'
        >
          <Input
            disabled
            value={`${params.namingConvention?.prefixText}${context.column.get('alias')}${
              params.namingConvention?.suffixText
            }`}
            contentBefore={<Tag size='small'>{params.urlPrefix}</Tag>}
          />
        </Tooltip>
      </FieldContainer>
    )
  }

  configs.teamify = {
    disabled: params.isTeam,
    inputProps: { checked: context.column.get('teamify') || params.isTeam }
  }

  configs.teamTemplate = {
    hidden:
      !context.props.showTeamTemplateField ||
      !context.column.get('teamify') ||
      params.getField('teamTemplate')?.hidden,
    options: context.state.teamTemplates?.map((t: any) => ({ key: t.title, text: t.title })) ?? []
  }

  configs.isConfidential = {
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        description={field.description}
        required={field.required}
        hidden={field.hidden}
      >
        <Switch
          checked={!!context.column.get('isConfidential')}
          onChange={(_, data) => {
            context.setColumn('isConfidential', data.checked)
            if (data.checked) {
              context.setColumn('privacy', strings.Provision.PrivacyFieldOptionPrivate)
            }
          }}
        />
      </FieldContainer>
    )
  }

  configs.privacy = {
    disabled: !!context.column.get('isConfidential'),
    options: [
      {
        key: strings.Provision.PrivacyFieldOptionPrivate,
        text: strings.Provision.PrivacyFieldOptionPrivate
      },
      {
        key: strings.Provision.PrivacyFieldOptionPublic,
        text: strings.Provision.PrivacyFieldOptionPublic
      }
    ]
  }

  configs.externalSharing = {
    hidden: params.getField('externalSharing')?.hidden || !params.enableExternalSharing,
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        description={field.description}
        required={field.required}
        hidden={params.getField('externalSharing')?.hidden || !params.enableExternalSharing}
      >
        <Switch
          checked={!!context.column.get('externalSharing')}
          onChange={(_, data) => {
            context.setColumn('externalSharing', data.checked)
            if (!data.checked) context.setColumn('guest', [])
          }}
        />
      </FieldContainer>
    )
  }

  configs.guest = {
    hidden: params.getField('externalSharing')?.hidden || !context.column.get('externalSharing')
  }

  configs.sensitivityLabel = {
    hidden: params.getField('sensitivityLabel')?.hidden || !params.enableSensitivityLabels,
    options:
      context.state.sensitivityLabels?.map((l: any) => ({ key: l.title, text: l.title })) ?? []
  }

  configs.sensitivityLabelLibrary = {
    hidden:
      params.getField('sensitivityLabelLibrary')?.hidden || !params.enableSensitivityLabelsLibrary,
    options:
      context.state.sensitivityLabelsLibrary?.map((l: any) => ({ key: l.title, text: l.title })) ??
      []
  }

  configs.retentionLabel = {
    hidden: params.getField('retentionLabel')?.hidden || !params.enableRetentionLabels,
    options: context.state.retentionLabels?.map((l: any) => ({ key: l.title, text: l.title })) ?? []
  }

  configs.expirationDate = {
    hidden: params.getField('expirationDate')?.hidden || !params.enableExpirationDate,
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        description={field.description}
        required={field.required}
        hidden={params.getField('expirationDate')?.hidden || !params.enableExpirationDate}
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
            defaultValue={
              context.props.defaultExpirationDate === '0'
                ? strings.Provision.ExpirationDateNoneOption
                : format(
                    strings.Provision.ExpirationDateMonthOption,
                    context.props.defaultExpirationDate
                  )
            }
            defaultSelectedOptions={[context.props.defaultExpirationDate || '0']}
            onOptionSelect={(_, data) => context.setColumn('expirationDate', data.optionValue)}
          >
            {context.props.defaultExpirationDate === '0' && (
              <Option value='0' text={strings.Provision.ExpirationDateNoneOption}>
                {strings.Provision.ExpirationDateNoneOption}
              </Option>
            )}
            {[1, 3, 6, 12, 24].map((month) => (
              <Option
                key={month.toString()}
                value={month.toString()}
                text={format(strings.Provision.ExpirationDateMonthOption, month)}
              >
                {format(strings.Provision.ExpirationDateMonthOption, month)}
              </Option>
            ))}
          </Dropdown>
        )}
      </FieldContainer>
    )
  }

  configs.readOnlyGroup = {
    hidden: params.getField('readOnlyGroup')?.hidden || !params.enableReadOnlyGroup
  }

  configs.internalChannel = {
    hidden:
      params.getField('internalChannel')?.hidden ||
      !params.enableInternalChannel ||
      (context.props.readOnlyGroupLogic && !context.column.get('readOnlyGroup'))
  }

  configs.language = {
    disabled: true,
    inputProps: {
      defaultValue: context.column.get('language'),
      defaultSelectedOptions: [context.column.get('language')]
    }
  }

  configs.timeZone = {
    disabled: true,
    inputProps: {
      defaultValue: context.column.get('timeZone'),
      defaultSelectedOptions: [context.column.get('timeZone')]
    }
  }

  configs.hubSiteTitle = {
    hidden: params.getField('hubSiteTitle')?.hidden || !params.joinHub,
    disabled: true,
    description: params.usesDifferentHub
      ? format(strings.Provision.DefaultHubInfoMessage, context.column.get('hubSiteTitle'))
      : undefined,
    inputProps: {
      defaultValue: context.column.get('hubSiteTitle'),
      defaultSelectedOptions: [context.column.get('hubSiteTitle')]
    }
  }

  return configs
}
