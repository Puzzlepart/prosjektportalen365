/* eslint-disable no-console */
import {
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderNavigation,
  DrawerHeaderTitle,
  DrawerFooter,
  Button,
  Toolbar,
  ToolbarGroup,
  ToolbarButton,
  mergeClasses,
  Switch,
  Input,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  CardProps,
  Text,
  Checkbox,
  Textarea,
  Dropdown,
  Option,
  Divider
} from '@fluentui/react-components'
import {
  Dismiss24Regular,
  Calendar24Regular,
  Settings24Regular,
  ArrowLeft24Regular
} from '@fluentui/react-icons'
import { useMotion } from '@fluentui/react-motion-preview'
import React, { FC, useState } from 'react'
import { IProjectProvisionProps } from './types'
import { useStyles, useMotionStyles } from './styles'
import { FieldContainer, getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import styles from './ProjectProvision.module.scss'

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  const stylesX = useStyles()
  const motionStyles = useMotionStyles()

  const [isOpen, setIsOpen] = useState(false)
  const [l2, setL2] = useState(false)
  const [l3, setL3] = useState(false)

  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(l2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!l2)
  const toolbarInfoIconMotion = useMotion<HTMLButtonElement>(!l3)
  const level1Motion = useMotion<HTMLDivElement>(!l2)
  const level2Motion = useMotion<HTMLDivElement>(l2)
  const level3Motion = useMotion<HTMLDivElement>(l3)

  const [siteTemplate, setSiteTemplate] = useState('project')
  const [privacy, setPrivacy] = useState('Privat - Brukere trenger tillatelse for å bli med')
  const [language, setLanguage] = useState('Norsk (Bokmål)')

  const resolveAsset = (asset: string) => {
    const ASSET_URL =
      'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/assets/'

    return `${ASSET_URL}${asset}`
  }

  const SiteType = (props: CardProps & { title: string; type: string; description: string; logo: string }) => {
    const styles = useStyles()

    return (
      <Card
        className={styles.card}
        selected={siteTemplate === props.type}
        onSelectionChange={() => setSiteTemplate(props.type)}
        floatingAction={<Checkbox shape='circular' checked={siteTemplate === props.type} />}
      >
        <CardPreview className={styles.grayBackground}>
          <img
            className={styles.smallRadius}
            src={resolveAsset(props.logo)}
            alt={`Preview image for ${props.title}`}
          />
        </CardPreview>
        <CardHeader header={<Text weight='semibold'>{props.title}</Text>} description={
          <Caption1 className={styles.caption}>{props.description}</Caption1>
        } />
      </Card>
    )
  }

  return (
    <div>
      <OverlayDrawer
        position='end'
        open={isOpen}
        size='medium'
        onOpenChange={(_, { open }) => setIsOpen(open)}
      >
        <DrawerHeader>
          <DrawerHeaderNavigation>
            <Toolbar className={stylesX.toolbar}>
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
                    onClick={() => setL2(false)}
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
                    icon={<Calendar24Regular />}
                    onClick={() => setL2(true)}
                  />
                )}
                {toolbarInfoIconMotion.canRender && (
                  <ToolbarButton
                    ref={toolbarInfoIconMotion.ref}
                    className={mergeClasses(
                      motionStyles.toolbarButton,
                      toolbarInfoIconMotion.active && motionStyles.toolbarButtonVisible
                    )}
                    aria-label='Go to calendar'
                    appearance='subtle'
                    icon={<Settings24Regular />}
                    onClick={() => setL3(true)}
                  />
                )}

                {/* <ToolbarButton
                  aria-label='Settings'
                  appearance='subtle'
                  icon={<Settings24Regular />}
                /> */}
                <ToolbarButton
                  aria-label='Close panel'
                  appearance='subtle'
                  icon={<Dismiss24Regular />}
                  onClick={() => setIsOpen(false)}
                />
              </ToolbarGroup>
            </Toolbar>
          </DrawerHeaderNavigation>
        </DrawerHeader>

        <div className={stylesX.body}>
          {level1Motion.canRender && (
            <DrawerBody
              ref={level1Motion.ref}
              className={mergeClasses(
                stylesX.level,
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
                <FieldContainer iconName='AppsList' label={'Områdetype'}>
                  <div className={stylesX.main}>
                    <SiteType title='Prosjekt' description='Prosjektportalen' logo='office1.png' type='project' />
                    <SiteType title='Samarbeid' description='Samarbeidsområde' logo='office2.png' type='collab' />
                    <SiteType title='Kommunikasjon' description='Kommunikasjonsområde' logo='sales_template.png' type='communication' />
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
                    prefix='PZL-'
                    onChange={(_, data) =>
                      console.log("setColumn('internalName', data.value)", data)
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
                    onChange={(_, data) =>
                      console.log("setColumn('searchQuery', data.value)", data)
                    }
                    rows={3}
                    placeholder={strings.Placeholder.SiteDescription}
                  />
                </FieldContainer>
                <FieldContainer
                  iconName='TextNumberFormat'
                  label='Alias/navn'
                  description={strings.InternalNameDescription}
                  required={true}
                >
                  <Input
                    onChange={(_, data) =>
                      console.log("setColumn('internalName', data.value)", data)
                    }
                    contentAfter={<Caption1>@puzzlepart.onmicrosoft.com</Caption1>}
                    placeholder={strings.Placeholder.TextField}
                  />
                </FieldContainer>
                <FieldContainer
                  iconName='TextNumberFormat'
                  label='Områdeadresse'
                  description={strings.InternalNameDescription}
                  required={true}
                >
                  <Input
                    onChange={(_, data) =>
                      console.log("setColumn('internalName', data.value)", data)
                    }
                    contentBefore={<Caption1>https://puzzlepart.sharepoint.com/sites/</Caption1>}
                    placeholder={strings.Placeholder.TextField}
                  />
                </FieldContainer>
                <Divider />
                <FieldContainer
                  iconName='TextNumberFormat'
                  label='Tilgangsinnstillinger'
                  description={strings.InternalNameDescription}
                >
                  <Dropdown
                    defaultValue={privacy}
                    defaultSelectedOptions={[privacy]}
                    onOptionSelect={(_, data) => setPrivacy(data.optionValue)}
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
                  iconName='TextNumberFormat'
                  label='Velg et språk'
                  description='Velg standard språk for området. Dette kan ikke endres senere.'
                >
                  <Dropdown
                    defaultValue={language}
                    defaultSelectedOptions={[language]}
                    onOptionSelect={(_, data) => setLanguage(data.optionValue)}
                  >
                    <Option value='Norsk (bokmål)'>Norsk (bokmål)</Option>
                    <Option value='Norsk (nynorsk)'>Norsk (nynorsk)</Option>
                    <Option value='Engelsk'>Engelsk</Option>
                  </Dropdown>
                </FieldContainer>
                <FieldContainer
                  iconName='GroupList'
                  label='Tillat eksterne gjester i gruppe/område'
                  description='Dersom denne er aktivert, vil man kunne invitere inn og dele enkeltfiler, mapper, bibliotek o.l. med eksterne gjestebrukere.' //  NB! Invitasjon av eksterne gjestebrukere vil først være mulig etter at gruppen/området er opprettet.
                >
                  <Switch
                    onChange={(_, data) =>
                      console.log("setColumn('isGroupable', data.checked)", data)
                    }
                  />
                </FieldContainer>
                <p className={styles.ignoreGap}>
                  Ditt område vil bli knyttet til en Microsoft 365-gruppe, som gir nettstedet ditt en
                  delt OneNote-notatblokk, gruppe-e-postadresse og delt kalender.
                </p>
              </div>
            </DrawerBody>
          )}

          {level2Motion.canRender && (
            <DrawerBody
              ref={level2Motion.ref}
              className={mergeClasses(
                stylesX.level,
                motionStyles.level,
                motionStyles.level2,
                level2Motion.active && motionStyles.levelVisible
              )}
            >
              <DrawerHeaderTitle>Prosjektinformasjon</DrawerHeaderTitle>
              <p>Level 2 innhold</p>
            </DrawerBody>
          )}
          {level3Motion.canRender && (
            <DrawerBody
              ref={level3Motion.ref}
              className={mergeClasses(
                stylesX.level,
                motionStyles.level,
                motionStyles.level3,
                level3Motion.active && motionStyles.levelVisible
              )}
            >
              <DrawerHeaderTitle>Prosjektinformasjon</DrawerHeaderTitle>
              <p>Level 3 innhold</p>
            </DrawerBody>
          )}
        </div>

        <DrawerFooter className={stylesX.footer}>
          <Button appearance='subtle' disabled={!l2 || !l3} onClick={() => {
            if (l2) setL2(false)
            if (l3) {
              setL3(false)
              setL2(true)
            }
          }}>
            Forrige
          </Button>

          <Button appearance='primary' disabled={l3} onClick={() => {
            if (!l2) setL2(true)
            if (l3) setL3(false)
          }}>
            Neste
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      <Button
        appearance='primary'
        size='large'
        icon={getFluentIcon('Add')}
        onClick={() => setIsOpen(true)}
      >
        Bestill område
      </Button>
    </div>
  )
}
