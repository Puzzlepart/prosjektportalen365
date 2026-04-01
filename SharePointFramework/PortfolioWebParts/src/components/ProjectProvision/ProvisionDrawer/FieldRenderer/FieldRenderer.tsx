import React, { FC, useContext } from 'react'
import {
  Input,
  Textarea,
  Switch,
  Dropdown,
  Option
} from '@fluentui/react-components'
import { FieldContainer } from 'pp365-shared-library'
import { ProjectProvisionContext } from '../../context'
import { UserMulti } from '../User'
import { Guest } from '../Guest'
import { ImageUpload } from '../ImageUpload'
import { IFieldRendererProps } from './types'

/**
 * Renders a single provision field based on its `dataType`.
 * Wraps each field in a `FieldContainer` for consistent layout.
 *
 * Field-specific behavior (custom visibility, validation, options, etc.)
 * is passed via the `config` prop from the parent.
 */
export const FieldRenderer: FC<IFieldRendererProps> = ({ field, config }) => {
  const context = useContext(ProjectProvisionContext)

  if (config?.onRender) {
    return <>{config.onRender(field)}</>
  }

  const isHidden = config?.hidden ?? field.hidden
  const isDisabled = config?.disabled ?? field.disabled
  const description = config?.description !== undefined ? (config.description || undefined) : field.description
  const validationState = config?.validationState ?? 'none'
  const validationMessage = config?.validationMessage || undefined

  const renderInput = () => {
    switch (field.dataType) {
      case 'text':
        return (
          <Input
            value={context.column.get(field.fieldName) ?? ''}
            disabled={isDisabled}
            placeholder={field.placeholder}
            onChange={(_, data) => context.setColumn(field.fieldName, data.value)}
            {...(config?.inputProps ?? {})}
          />
        )

      case 'note':
        return (
          <Textarea
            value={context.column.get(field.fieldName) ?? ''}
            rows={2}
            placeholder={field.placeholder}
            onChange={(_, data) => context.setColumn(field.fieldName, data.value)}
            {...(config?.inputProps ?? {})}
          />
        )

      case 'boolean':
        return (
          <Switch
            checked={!!context.column.get(field.fieldName)}
            disabled={isDisabled}
            onChange={(_, data) => context.setColumn(field.fieldName, data.checked)}
            {...(config?.inputProps ?? {})}
          />
        )

      case 'choice': {
        const options = config?.options ?? []
        const hasDefaultValue = config?.inputProps?.defaultValue !== undefined
        return (
          <Dropdown
            {...(!hasDefaultValue && {
              value: context.column.get(field.fieldName) ?? '',
              selectedOptions: [context.column.get(field.fieldName)]
            })}
            disabled={isDisabled}
            onOptionSelect={(_, data) => context.setColumn(field.fieldName, data.optionValue)}
            {...(config?.inputProps ?? {})}
          >
            {options.map((opt) => (
              <Option key={opt.key} value={opt.key}>
                {opt.text}
              </Option>
            ))}
          </Dropdown>
        )
      }

      case 'userMulti':
        return <UserMulti type={field.fieldName as any} {...(config?.inputProps ?? {})} />

      case 'guest':
        return <Guest {...(config?.inputProps ?? {})} />

      case 'image':
        return (
          <ImageUpload
            onImageUpload={(image) => context.setColumn(field.fieldName, image)}
            currentImage={context.column.get(field.fieldName)}
            {...(config?.inputProps ?? {})}
          />
        )

      default:
        return null
    }
  }

  const input = renderInput()
  if (!input) return null

  return (
    <FieldContainer
      iconName={field.iconName}
      label={field.displayName}
      description={description}
      required={field.required}
      hidden={isHidden}
      validationState={validationState}
      validationMessage={validationMessage}
    >
      {input}
    </FieldContainer>
  )
}
