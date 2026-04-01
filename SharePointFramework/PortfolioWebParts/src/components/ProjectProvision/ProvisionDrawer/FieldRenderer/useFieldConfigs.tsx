import React, { useContext } from 'react'
import {
  Input,
  Dropdown,
  Option,
  Tag,
  Tooltip
} from '@fluentui/react-components'
import { DatePicker } from '@fluentui/react-datepicker-compat'
import { DayOfWeek, format } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer } from 'pp365-shared-library'
import { ProjectProvisionContext } from '../../context'
import { SiteType } from '../SiteType'
import { useLocalInput } from '../useLocalInput'
import { IFieldConfig } from './types'

interface UseFieldConfigsParams {
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
}

/**
 * Builds a field config map that provides field-specific rendering overrides,
 * visibility logic, validation, and custom renderers for provision fields.
 *
 * Computed fresh each render — no useMemo, because `context.column` (a Map)
 * changes reference on every setColumn call, making memoization ineffective
 * and causing stale closures.
 */
export function useFieldConfigs(params: UseFieldConfigsParams): Record<string, IFieldConfig> {
  const context = useContext(ProjectProvisionContext)

  // Local input hooks must be at hook top-level (not inside useMemo/callbacks)
  const nameInput = useLocalInput('name')
  const descriptionInput = useLocalInput('description')
  const justificationInput = useLocalInput('justification')
  const additionalInfoInput = useLocalInput('additionalInfo')

  const configs: Record<string, IFieldConfig> = {}

  // ---- LEVEL 0 FIELDS ----

  // type: SiteType cards or dropdown
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
            onOptionSelect={(_, data) => context.setColumn('type', data.optionValue)}
          >
            {context.state.types?.map((type) => (
              <Option key={type.title} text={type.title} title={type.description}>
                {type.title}
              </Option>
            ))}
          </Dropdown>
        )}
      </FieldContainer>
    )
  }

  // name: special validation, prefix/suffix, site existence check
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

  // description, justification, additionalInfo: use local input hooks
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

  // member: duplicate owner/member validation
  configs.member = {
    validationState: params.duplicateOwnerMembers.length > 0 ? 'error' : 'none',
    validationMessage:
      params.duplicateOwnerMembers.length > 0
        ? strings.Provision.DuplicateOwnerMemberMessage
        : undefined
  }

  // alias: disabled, shows prefix + alias + suffix
  configs.alias = {
    onRender: (field) => (
      <FieldContainer iconName={field.iconName} label={field.displayName} hidden={field.hidden}>
        <Input
          disabled
          value={`${params.namingConvention?.prefixText}${context.column.get('alias')}${params.namingConvention?.suffixText}`}
          contentAfter={<Tag size='small'>{params.aliasSuffix}</Tag>}
        />
      </FieldContainer>
    )
  }

  // url: disabled, shows urlPrefix + alias
  configs.url = {
    onRender: (field) => (
      <FieldContainer iconName={field.iconName} label={field.displayName} hidden={field.hidden}>
        <Input
          disabled
          value={`${params.namingConvention?.prefixText}${context.column.get('alias')}${params.namingConvention?.suffixText}`}
          contentBefore={<Tag size='small'>{params.urlPrefix}</Tag>}
        />
      </FieldContainer>
    )
  }

  // ---- LEVEL 1 FIELDS ----

  // teamify: disabled if already a team
  configs.teamify = {
    disabled: params.isTeam,
    inputProps: {
      checked: context.column.get('teamify') || params.isTeam
    }
  }

  // teamTemplate: hidden if teamify is off
  configs.teamTemplate = {
    hidden: !context.column.get('teamify') || params.getField('teamTemplate')?.hidden,
    options: context.state.teamTemplates?.map((t) => ({ key: t.title, text: t.title })) ?? []
  }

  // isConfidential: when toggled on, forces privacy to Private
  configs.isConfidential = {
    onRender: (field) => {
      const isHidden = field.hidden
      return (
        <FieldContainer
          iconName={field.iconName}
          label={field.displayName}
          description={field.description}
          required={field.required}
          hidden={isHidden}
        >
          <input type='hidden' />
          {/* Use a controlled Switch that only sets privacy on user interaction */}
          <span>
            {React.createElement(require('@fluentui/react-components').Switch, {
              checked: !!context.column.get('isConfidential'),
              onChange: (_: any, data: any) => {
                context.setColumn('isConfidential', data.checked)
                if (data.checked) {
                  context.setColumn('privacy', strings.Provision.PrivacyFieldOptionPrivate)
                }
              }
            })}
          </span>
        </FieldContainer>
      )
    }
  }

  // privacy: disabled when confidential, options Private/Public
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

  // externalSharing: hidden if not enabled for type
  configs.externalSharing = {
    hidden: params.getField('externalSharing')?.hidden || !params.enableExternalSharing,
    onRender: (field) => {
      const isHidden = params.getField('externalSharing')?.hidden || !params.enableExternalSharing
      return (
        <FieldContainer
          iconName={field.iconName}
          label={field.displayName}
          description={field.description}
          required={field.required}
          hidden={isHidden}
        >
          {React.createElement(require('@fluentui/react-components').Switch, {
            checked: !!context.column.get('externalSharing'),
            onChange: (_: any, data: any) => {
              context.setColumn('externalSharing', data.checked)
              if (!data.checked) context.setColumn('guest', [])
            }
          })}
        </FieldContainer>
      )
    }
  }

  // guest: hidden if externalSharing is hidden or off
  configs.guest = {
    hidden: params.getField('externalSharing')?.hidden || !context.column.get('externalSharing')
  }

  // sensitivityLabel
  configs.sensitivityLabel = {
    hidden: params.getField('sensitivityLabel')?.hidden || !params.enableSensitivityLabels,
    options:
      context.state.sensitivityLabels?.map((l) => ({ key: l.title, text: l.title })) ?? []
  }

  // sensitivityLabelLibrary
  configs.sensitivityLabelLibrary = {
    hidden:
      params.getField('sensitivityLabelLibrary')?.hidden ||
      !params.enableSensitivityLabelsLibrary,
    options:
      context.state.sensitivityLabelsLibrary?.map((l) => ({ key: l.title, text: l.title })) ?? []
  }

  // retentionLabel
  configs.retentionLabel = {
    hidden: params.getField('retentionLabel')?.hidden || !params.enableRetentionLabels,
    options:
      context.state.retentionLabels?.map((l) => ({ key: l.title, text: l.title })) ?? []
  }

  // expirationDate: date picker or month dropdown
  configs.expirationDate = {
    hidden: params.getField('expirationDate')?.hidden || !params.enableExpirationDate,
    onRender: (field) => (
      <FieldContainer
        iconName={field.iconName}
        label={field.displayName}
        description={field.description}
        required={field.required}
        hidden={
          params.getField('expirationDate')?.hidden || !params.enableExpirationDate
        }
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

  // ---- LEVEL 2 FIELDS ----

  // readOnlyGroup
  configs.readOnlyGroup = {
    hidden: params.getField('readOnlyGroup')?.hidden || !params.enableReadOnlyGroup
  }

  // internalChannel: hidden unless readOnlyGroup is enabled and checked
  configs.internalChannel = {
    hidden:
      params.getField('internalChannel')?.hidden ||
      !params.enableInternalChannel ||
      (context.props.readOnlyGroupLogic && !context.column.get('readOnlyGroup'))
  }

  // language, timeZone: disabled dropdowns with default values
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

  // hubSiteTitle: hidden if joinHub is false
  configs.hubSiteTitle = {
    hidden: params.getField('hubSiteTitle')?.hidden || !params.joinHub,
    disabled: true,
    description:
      params.usesDifferentHub
        ? format(
            strings.Provision.DefaultHubInfoMessage,
            context.column.get('hubSiteTitle')
          )
        : undefined,
    inputProps: {
      defaultValue: context.column.get('hubSiteTitle'),
      defaultSelectedOptions: [context.column.get('hubSiteTitle')]
    }
  }

  return configs
}
