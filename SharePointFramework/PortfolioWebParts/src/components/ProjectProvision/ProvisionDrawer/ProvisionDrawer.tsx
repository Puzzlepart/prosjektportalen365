/* eslint-disable no-console */
import * as React from 'react'
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
  Option,
  Button,
  Tag,
  Tooltip
} from '@fluentui/react-components'
import {
  ArrowLeft24Regular,
  DataUsage24Regular,
  Settings24Regular,
  Dismiss24Regular
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { FieldContainer } from 'pp365-shared-library'
import { SiteType } from '../SiteType'
import { useProvisionDrawer } from './useProvisionDrawer'
import styles from './ProvisionDrawer.module.scss'
import { DebugModel } from './DebugModel'
import { User } from './User'
import { Guest } from './Guest'

export const ProvisionDrawer = () => {
  const {
    motionStyles,
    level2,
    setLevel2,
    toolbarBackIconMotion,
    toolbarCalendarIconMotion,
    level1Motion,
    level2Motion,
    context,
    onSave,
    isSaveDisabled
  } = useProvisionDrawer()

  const namingConvention = context.state.settings.get('NamingConvention')

  return (
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
                  aria-label='Back'
                  appearance='subtle'
                  icon={<ArrowLeft24Regular />}
                  onClick={() => setLevel2(false)}
                />
              )}
            </ToolbarGroup>
            <ToolbarGroup>
              {toolbarCalendarIconMotion.canRender && (
                <ToolbarButton
                  ref={toolbarCalendarIconMotion.ref}
                  className={mergeClasses(
                    motionStyles.toolbarButton,
                    toolbarCalendarIconMotion.active && motionStyles.toolbarButtonVisible
                  )}
                  aria-label='Go to calendar'
                  appearance='subtle'
                  icon={<DataUsage24Regular />}
                  onClick={() => setLevel2(true)}
                />
              )}

              <ToolbarButton
                aria-label='Settings'
                appearance='subtle'
                icon={<Settings24Regular />}
              />
              <ToolbarButton
                aria-label='Close panel'
                appearance='subtle'
                icon={<Dismiss24Regular />}
                onClick={() => context.setState({ showProvisionDrawer: false })}
              />
            </ToolbarGroup>
          </Toolbar>
        </DrawerHeaderNavigation>
      </DrawerHeader>

      <div className={styles.body}>
        {level1Motion.canRender && (
          <DrawerBody
            ref={level1Motion.ref}
            className={mergeClasses(
              styles.level,
              motionStyles.level,
              motionStyles.level1,
              level1Motion.active && motionStyles.levelVisible
            )}
          >
            <DrawerHeaderTitle>Bestill område</DrawerHeaderTitle>
            <p>
              Her kan du bestille et nytt område. Velg en av områdetypene under, og fyll ut
              informasjonen for området.
            </p>
            <div className={styles.content}>
              {DEBUG && <DebugModel />}
              <FieldContainer iconName='AppsList' label={'Områdetype'}>
                <div className={styles.sitetypes}>
                  <SiteType
                    title='Prosjekt'
                    description='Prosjektportalen'
                    logo='office1.png'
                    type='project'
                  />
                  <SiteType
                    title='Samarbeid'
                    description='Samarbeidsområde'
                    logo='office2.png'
                    type='collab'
                  />
                  <SiteType
                    title='Kommunikasjon'
                    description='Kommunikasjonsområde'
                    logo='sales_template.png'
                    type='communication'
                  />
                </div>
              </FieldContainer>
              <FieldContainer
                iconName='TextNumberFormat'
                label={strings.SiteNameLabel}
                description='Velg et unikt navn som følger organisasjonens navngivningsstandarder.'
                required={true}
                validationState='success'
                validationMessage='Navnet er ledig'
              >
                <Input
                  value={context.column.get('name')}
                  onChange={(_, data) => {
                    context.setColumn('name', data.value)
                  }}
                  contentBefore={
                    <Tooltip
                      withArrow
                      content='Dette er den angitte prefiksen for områdenavnet.'
                      relationship='label'
                    >
                      <Tag size='small'>{namingConvention.prefixText}</Tag>
                    </Tooltip>
                  }
                  contentAfter={
                    <Tooltip
                      withArrow
                      content='Dette er den angitte suffiksen for områdenavnet.'
                      relationship='label'
                    >
                      <Tag size='small'>{namingConvention.suffixText}</Tag>
                    </Tooltip>
                  }
                  placeholder={strings.Placeholder.SiteName}
                />
              </FieldContainer>
              <FieldContainer
                iconName='TextAlignLeft'
                label={strings.SiteDescriptionLabel}
                description={strings.SiteDescriptionDescription}
              >
                <Textarea
                  value={context.column.get('description')}
                  onChange={(_, data) => context.setColumn('description', data.value)}
                  rows={2}
                  placeholder={strings.Placeholder.SiteDescription}
                />
              </FieldContainer>
              <FieldContainer
                iconName='TextAlignLeft'
                label='Forretningsmessig begrunnelse'
                description='Beskriv hvorfor du trenger dette området.'
                required={true}
              >
                <Textarea
                  value={context.column.get('justification')}
                  onChange={(_, data) => context.setColumn('justification', data.value)}
                  rows={2}
                  placeholder={strings.Placeholder.SiteDescription}
                />
              </FieldContainer>
              {/* <FieldContainer
                iconName='TextNumberFormat'
                label='Alias/navn'
                description='Velg et unikt alias som følger organisasjonens navngivningsstandarder.'
              >
                <Input
                  disabled
                  value={context.state.properties.alias}
                  onChange={(_, data) => context.setColumn('alias', data.value)}
                  contentAfter={<Caption1>{aliasSuffix}</Caption1>}
                />
              </FieldContainer>
              <FieldContainer
                iconName='Link'
                label='Områdeadresse'
                description='Områdeadressen er en del av URL-en til området.'
              >
                <Input
                  disabled
                  value={context.state.properties.url}
                  onChange={(_, data) => context.setColumn('url', data.value)}
                  contentBefore={<Caption1>{urlPrefix}</Caption1>}
                />
              </FieldContainer> */}
              <Divider />
              <FieldContainer
                iconName='Person'
                label='Eier(e)'
                description='Eier(e) har full tilgang til området og kan legge til og fjerne medlemmer. Du kan legge til flere eiere senere.'
                required={true}
              >
                <User type='owner' />
              </FieldContainer>
              <FieldContainer
                iconName='People'
                label='Medlem(mer)'
                description='Medlem(mer) har tilgang til området basert på tillatelsene som er satt. Du kan legge til flere medlemmer senere.'
              >
                {/* Members can not be the same as the owner */}
                <User type='member' />
              </FieldContainer>
            </div>
          </DrawerBody>
        )}

        {level2Motion.canRender && (
          <DrawerBody
            ref={level2Motion.ref}
            className={mergeClasses(
              styles.level,
              motionStyles.level,
              motionStyles.level2,
              level2Motion.active && motionStyles.levelVisible
            )}
          >
            <DrawerHeaderTitle>Klassifisering</DrawerHeaderTitle>
            <p>
              Her kan du velge klassifisering for området. Angi språk, tilgangsinnstillinger og
              hubtilknytning.
            </p>
            <div className={styles.content}>
              {DEBUG && <DebugModel />}
              <FieldContainer
                iconName='BoxToolbox'
                label='Konfidensielle/sensitive data'
                description='Vil konfidensielle eller sensitive data bli lagret i dette rommet? Dersom ja, må du sørge for at du har satt riktige tillatelser.'
              >
                <Switch
                  checked={context.column.get('isConfidential')}
                  value={context.column.get('isConfidential')}
                  onChange={(_, data) => {
                    context.setColumn('isConfidential', data.checked)

                    if (data.checked) {
                      context.setColumn(
                        'privacy',
                        'Privat - Brukere trenger tillatelse for å bli med'
                      )
                    }
                  }}
                />
              </FieldContainer>
              <FieldContainer
                iconName='Eye'
                label='Tilgangsinnstillinger'
                description='Velg om området skal være privat eller offentlig.'
              >
                <Dropdown
                  defaultValue={context.column.get('privacy')}
                  selectedOptions={[context.column.get('privacy')]}
                  value={context.column.get('privacy')}
                  defaultSelectedOptions={[context.column.get('privacy')]}
                  onOptionSelect={(_, data) => {
                    context.setColumn('privacy', data.optionValue)
                  }}
                  disabled={context.column.get('isConfidential')}
                >
                  <Option value='Privat - Brukere trenger tillatelse for å bli med'>
                    Privat - Brukere trenger tillatelse for å bli med
                  </Option>
                  <Option value='Offentlig - Alle i organisasjonen kan bli med'>
                    Offentlig - Alle i organisasjonen kan bli med
                  </Option>
                </Dropdown>
              </FieldContainer>
              <FieldContainer
                iconName='Guest'
                label='Tillat eksterne gjester'
                description='Dersom denne er aktivert, vil man kunne invitere inn og dele enkeltfiler, mapper, bibliotek o.l. med eksterne gjestebrukere. NB! Invitasjon av eksterne gjestebrukere vil først være mulig etter at gruppen/området er opprettet.'
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
                label='Gjest(er)'
                description='Her kan du legge til eksterne gjester. Vennligst skriv inn en gyldig e-postadresse.'
                hidden={!context.column.get('externalSharing')}
              >
                <Guest />
              </FieldContainer>
              <FieldContainer iconName='LocalLanguage' label='Språk'>
                <Dropdown
                  defaultValue={context.column.get('language')}
                  defaultSelectedOptions={[context.column.get('language')]}
                  disabled
                />
              </FieldContainer>
              <FieldContainer iconName='Clock' label='Tidsssone'>
                <Dropdown
                  defaultValue={context.column.get('timeZone')}
                  defaultSelectedOptions={[context.column.get('timeZone')]}
                  disabled
                />
              </FieldContainer>
              <FieldContainer iconName='Database' label='Hubtilknytning'>
                <Dropdown
                  defaultValue={context.column.get('hubSiteTitle')}
                  defaultSelectedOptions={[context.column.get('hubSiteTitle')]}
                  disabled
                />
              </FieldContainer>
              <p className={styles.ignoreGap}>
                Ditt område vil bli knyttet til en Microsoft 365-gruppe, som gir nettstedet ditt en
                delt OneNote-notatblokk, gruppe-e-postadresse og delt kalender.
              </p>
            </div>
          </DrawerBody>
        )}
      </div>

      <DrawerFooter className={styles.footer}>
        <Button appearance='subtle' disabled={!level2} onClick={() => setLevel2(false)}>
          Forrige
        </Button>

        <Button
          appearance='primary'
          disabled={level2 && isSaveDisabled}
          onClick={() => {
            level2 ? onSave() : setLevel2(true)
          }}
        >
          {level2 ? 'Bestill område' : 'Neste'}
        </Button>
        {/* <Button appearance='primary' disabled={level2} onClick={() => setLevel2(true)}>
            Neste
          </Button> */}
      </DrawerFooter>
    </OverlayDrawer>
  )
}
