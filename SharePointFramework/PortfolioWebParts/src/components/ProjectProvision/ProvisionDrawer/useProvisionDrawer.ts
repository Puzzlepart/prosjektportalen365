/* eslint-disable prefer-spread */
import { useContext, useState } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './styles'
import { ProjectProvisionContext } from '../context'
import { SPProvisionRequestItem } from 'models/ProvisionRequest'
import { getGUID } from '@pnp/core'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const context = useContext(ProjectProvisionContext)

  const [level2, setLevel2] = useState(false)
  const motionStyles = useMotionStyles()
  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(level2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!level2)
  const level1Motion = useMotion<HTMLDivElement>(!level2)
  const level2Motion = useMotion<HTMLDivElement>(level2)

  /**
   * Saves the request to the Provision Requests list.
   */
  const onSave = async (): Promise<boolean> => {
    const namingConvention = context.state.settings.get('NamingConvention')
    const baseUrl = `${context.props.webAbsoluteUrl.split('sites')[0]}sites/`

    const siteName = context.column.get('name')
    const alias = siteName.replace(/[^a-zA-Z0-9-_ÆØÅæøå ]/g, '')

    const requestItem: SPProvisionRequestItem = {
      Title: context.column.get('name'),
      SpaceDisplayName: context.column.get('name'),
      Description: context.column.get('description'),
      BusinessJustification: context.column.get('justification'),
      SpaceType: 'Prosjektområde',
      SpaceTypeInternal: context.column.get('type'),
      OwnersId: context.state.properties.owner,
      MembersId: context.state.properties.member,
      Visibility: context.state.properties.privacy,
      ConfidentialData: context.column.get('isConfidential'),
      ExternalSharingRequired: context.column.get('externalSharing'),
      Guests: context.column.get('guest')?.join(';'),
      SiteURL: {
        Description: `${baseUrl}${context.column.get('name')}`,
        Url: `${baseUrl}${context.column.get('name')}`
      },
      SiteAlias: alias,
      MailboxAlias: alias,
      TimeZoneId: 4,
      LCID: 1044,
      JoinHub: true,
      HubSiteTitle: context.props.pageContext.web.title,
      HubSite: context.props.pageContext.legacyPageContext.hubSiteId,
      Prefix: namingConvention.prefixText,
      Suffix: namingConvention.suffixText,
      Status: 'Submitted',
      Stage: 'Submitted',
      RequestKey: getGUID()
    }

    return await context.props.dataAdapter.addProvisionRequests(
      requestItem,
      context.props.provisionUrl
    )
  }

  /**
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled =
    context.column.get('name')?.length < 2 ||
    context.column.get('justification')?.length < 2 ||
    context.column.get('owner')?.length < 1

  return {
    level2,
    setLevel2,
    motionStyles,
    toolbarBackIconMotion,
    toolbarCalendarIconMotion,
    level1Motion,
    level2Motion,
    context,
    onSave,
    isSaveDisabled
  }
}
