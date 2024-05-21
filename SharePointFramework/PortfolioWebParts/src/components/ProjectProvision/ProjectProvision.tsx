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
  Textarea,
  Dropdown,
  Option,
  Divider,
  TagPicker,
  TagPickerList,
  TagPickerInput,
  TagPickerControl,
  TagPickerProps,
  TagPickerOption,
  TagPickerGroup,
  useTagPickerFilter,
  Tag,
  Avatar,
  Menu,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  useRestoreFocusTarget,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger
} from '@fluentui/react-components'
import {
  Dismiss24Regular,
  DataUsage24Regular,
  Settings24Regular,
  ArrowLeft24Regular
} from '@fluentui/react-icons'
import { useMotion } from '@fluentui/react-motion-preview'
import React, { FC, useContext, useState } from 'react'
import { IProjectProvisionProps } from './types'
import { useStyles, useMotionStyles } from './styles'
import { FieldContainer, getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'
import styles from './ProjectProvision.module.scss'
import { ProvisionStatus } from './ProvisionStatus/ProvisionStatus'
import { useProjectProvision } from './useProjectProvision'
import { ProjectProvisionContext } from './context'
import { SiteType } from './SiteType'

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  const { state, setState } = useProjectProvision(props)

  const stylesX = useStyles()
  const motionStyles = useMotionStyles()

  const [isOpen, setIsOpen] = useState(false)
  const [l2, setL2] = useState(false)

  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(l2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!l2)
  const level1Motion = useMotion<HTMLDivElement>(!l2)
  const level2Motion = useMotion<HTMLDivElement>(l2)

  const [siteTitle, setSiteTitle] = useState('')
  const [privacy, setPrivacy] = useState('Privat - Brukere trenger tillatelse for å bli med')
  const [language, setLanguage] = useState('Norsk (Bokmål)')

  const [open, setOpen] = React.useState(false)
  const restoreFocusTargetAttribute = useRestoreFocusTarget()

  const options = [
    'John Doe',
    'Jane Doe',
    'Max Mustermann',
    'Erika Mustermann',
    'Pierre Dupont',
    'Amelie Dupont',
    'Mario Rossi',
    'Maria Rossi'
  ]

  const [query, setQuery] = React.useState<string>('')
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([])
  const onOptionSelect: TagPickerProps['onOptionSelect'] = (e, data) => {
    if (data.value === 'no-matches') {
      return
    }
    setSelectedOptions(data.selectedOptions)
    setQuery('')
  }

  const children = useTagPickerFilter({
    query,
    options,
    noOptionsElement: <TagPickerOption value='no-matches'>Ingen treff</TagPickerOption>,
    renderOption: (option) => (
      <TagPickerOption
        secondaryContent='Microsoft FTE'
        key={option}
        media={<Avatar shape='square' aria-hidden name={option} color='colorful' />}
        value={option}
      >
        {option}
      </TagPickerOption>
    ),

    filter: (option) =>
      !selectedOptions.includes(option) && option.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div>
      <ProjectProvisionContext.Provider value={{ props, state, setState}}>
        <OverlayDrawer
          role='panel'
          position='end'
          open={isOpen}
          size='medium'
          onOpenChange={(_, { open }) => setIsOpen(open)}
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
                      icon={<DataUsage24Regular />}
                      onClick={() => setL2(true)}
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
                    onClick={() => setIsOpen(false)}
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
                      // contentBefore={<Caption1>pzl-</Caption1>}
                      onChange={(_, data) => setSiteTitle(data.value)}
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
                      onChange={(_, data) =>
                        console.log("setColumn('searchQuery', data.value)", data)
                      }
                      rows={2}
                      placeholder={strings.Placeholder.SiteDescription}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='TextNumberFormat'
                    label='Alias/navn'
                    description='Velg et unikt alias som følger organisasjonens navngivningsstandarder.'
                    required={true}
                  >
                    <Input
                      value={siteTitle}
                      onChange={(_, data) =>
                        console.log("setColumn('internalName', data.value)", data)
                      }
                      contentAfter={<Caption1>@puzzlepart.onmicrosoft.com</Caption1>}
                      placeholder={strings.Placeholder.TextField}
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='Link'
                    label='Områdeadresse'
                    description='Områdeadressen er en del av URL-en til området.'
                    required={true}
                  >
                    <Input
                      value={siteTitle}
                      onChange={(_, data) =>
                        console.log("setColumn('internalName', data.value)", data)
                      }
                      contentBefore={<Caption1>https://puzzlepart.sharepoint.com/sites/</Caption1>}
                      placeholder={strings.Placeholder.TextField}
                    />
                  </FieldContainer>
                  <Divider />
                  <FieldContainer
                    iconName='Person'
                    label='Eier(e)'
                    description='Eier(e) har full tilgang til området og kan legge til og fjerne medlemmer. Du kan legge til flere eiere senere.'
                    required={true}
                  >
                    <TagPicker onOptionSelect={onOptionSelect} selectedOptions={selectedOptions}>
                      <TagPickerControl>
                        <TagPickerGroup>
                          {selectedOptions.map((option) => (
                            <Tag
                              key={option}
                              shape='rounded'
                              media={<Avatar aria-hidden name={option} color='colorful' />}
                              value={option}
                            >
                              {option}
                            </Tag>
                          ))}
                        </TagPickerGroup>
                        <TagPickerInput
                          aria-label='Select Employees'
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </TagPickerControl>
                      <TagPickerList>{children}</TagPickerList>
                    </TagPicker>
                  </FieldContainer>
                  <FieldContainer
                    iconName='People'
                    label='Medlem(mer)'
                    description='Medlem(mer) har tilgang til området basert på tillatelsene som er satt. Du kan legge til flere medlemmer senere.'
                  >
                    {/* Members can not be the same as the owner */}
                    <TagPicker onOptionSelect={onOptionSelect} selectedOptions={selectedOptions}>
                      <TagPickerControl>
                        <TagPickerGroup>
                          {selectedOptions.map((option) => (
                            <Tag
                              key={option}
                              shape='rounded'
                              media={<Avatar aria-hidden name={option} color='colorful' />}
                              value={option}
                            >
                              {option}
                            </Tag>
                          ))}
                        </TagPickerGroup>
                        <TagPickerInput
                          aria-label='Select Employees'
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </TagPickerControl>
                      <TagPickerList>{children}</TagPickerList>
                    </TagPicker>
                  </FieldContainer>
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
                <DrawerHeaderTitle>Klassifisering</DrawerHeaderTitle>
                <p>
                  Her kan du velge klassifisering for området. Angi språk, tilgangsinnstillinger og
                  hubtilknytning.
                </p>
                <div className={styles.content}>
                  <FieldContainer
                    iconName='Eye'
                    label='Tilgangsinnstillinger'
                    description='Velg om området skal være privat eller offentlig.'
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
                    iconName='Guest'
                    label='Tillat eksterne gjester'
                    description='Dersom denne er aktivert, vil man kunne invitere inn og dele enkeltfiler, mapper, bibliotek o.l. med eksterne gjestebrukere. NB! Invitasjon av eksterne gjestebrukere vil først være mulig etter at gruppen/området er opprettet.'
                  >
                    <Switch
                      onChange={(_, data) =>
                        console.log("setColumn('isGroupable', data.checked)", data)
                      }
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='BoxToolbox'
                    label='Konfidensielle/sensitive data'
                    description='Vil konfidensielle eller sensitive data bli lagret i dette rommet? Dersom ja, må du sørge for at du har satt riktige tillatelser.'
                  >
                    <Switch
                      onChange={(_, data) =>
                        console.log("setColumn('isGroupable', data.checked)", data)
                      }
                    />
                  </FieldContainer>
                  <FieldContainer
                    iconName='LocalLanguage'
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
                    iconName='Clock'
                    label='Tidsssone'
                    description='Velg tidssone for området.'
                  >
                    <Dropdown
                      defaultValue={'(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'}
                      defaultSelectedOptions={[
                        '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'
                      ]}
                      disabled
                    >
                      <Option value='(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'>
                        (UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna
                      </Option>
                    </Dropdown>
                  </FieldContainer>
                  <FieldContainer
                    iconName='Database'
                    label='Hubtilknytning'
                    description='Velg hvilken hub dette området skal tilknyttes.'
                  >
                    <Dropdown
                      defaultValue={'Prosjektportalen 365'}
                      defaultSelectedOptions={['Prosjektportalen 365']}
                      disabled
                    >
                      <Option value='Prosjektportalen 365'>Prosjektportalen 365</Option>
                    </Dropdown>
                  </FieldContainer>
                  <p className={styles.ignoreGap}>
                    Ditt område vil bli knyttet til en Microsoft 365-gruppe, som gir nettstedet ditt
                    en delt OneNote-notatblokk, gruppe-e-postadresse og delt kalender.
                  </p>
                </div>
              </DrawerBody>
            )}
          </div>

          <DrawerFooter className={styles.footer}>
            <Button appearance='subtle' disabled={!l2} onClick={() => setL2(false)}>
              Forrige
            </Button>

            <Button
              appearance='primary'
              onClick={() => {
                l2 ? console.log('big orda todai!') : setL2(true)
              }}
            >
              {l2 ? 'Bestill område' : 'Neste'}
            </Button>
            {/* <Button appearance='primary' disabled={l2} onClick={() => setL2(true)}>
            Neste
          </Button> */}
          </DrawerFooter>
        </OverlayDrawer>

        <Menu positioning='below-end'>
          <MenuTrigger disableButtonEnhancement>
            {(triggerProps: MenuButtonProps) => (
              <SplitButton
                menuButton={triggerProps}
                primaryActionButton={{
                  onClick: () => setIsOpen(true)
                }}
                icon={getFluentIcon('Add')}
                appearance='primary'
                size='large'
              >
                Bestill område
              </SplitButton>
            )}
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                {...restoreFocusTargetAttribute}
                onClick={() => {
                  // it is the user responsibility to open the dialog
                  setOpen(true)
                }}
              >
                Mine bestillinger
              </MenuItem>
              <MenuItem>Registrer idé</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <Dialog
          modalType='modal'
          open={open}
          onOpenChange={(event, data) => {
            setOpen(data.open)
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle
                action={
                  <DialogTrigger action='close'>
                    <Button appearance='subtle' aria-label='close' icon={<Dismiss24Regular />} />
                  </DialogTrigger>
                }
              >
                Mine bestillinger
              </DialogTitle>
              <DialogContent>
                <p>
                  Her kan du se status på dine bestillinger, hvem som er godkjenner og
                  godkjenningsstatus. Dersom en bestilling blir avslått, kan du velge å bestille på
                  nytt basert på en tidligere bestilling eller fjerne bestillingen fra listen.
                </p>
                <ProvisionStatus />
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </ProjectProvisionContext.Provider>
    </div>
  )
}
