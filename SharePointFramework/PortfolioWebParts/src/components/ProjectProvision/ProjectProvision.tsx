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
  DialogTitle
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
import { ProvisionStatus } from './ProvisionStatus/ProvisionStatus'

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  const stylesX = useStyles()
  const motionStyles = useMotionStyles()

  const [isOpen, setIsOpen] = useState(false)
  const [l2, setL2] = useState(false)

  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(l2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!l2)
  const level1Motion = useMotion<HTMLDivElement>(!l2)
  const level2Motion = useMotion<HTMLDivElement>(l2)

  const [siteTemplate, setSiteTemplate] = useState('project')
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

  const resolveAsset = (asset: string) => {
    const ASSET_URL =
      'https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/stories/assets/'

    return `${ASSET_URL}${asset}`
  }

  const SiteType = (
    props: CardProps & { title: string; type: string; description: string; logo: string }
  ) => {
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
        <CardHeader
          header={<Text weight='semibold'>{props.title}</Text>}
          description={<Caption1 className={styles.caption}>{props.description}</Caption1>}
        />
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
                  iconName='Link'
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
                  iconName='Person'
                  label='Eier(e)'
                  description={strings.InternalNameDescription}
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
                  iconName='Person'
                  label='Medlem(mer)'
                  description={strings.InternalNameDescription}
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
                  Ditt område vil bli knyttet til en Microsoft 365-gruppe, som gir nettstedet ditt
                  en delt OneNote-notatblokk, gruppe-e-postadresse og delt kalender.
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
        </div>

        <DrawerFooter className={stylesX.footer}>
          <Button appearance='subtle' disabled={!l2} onClick={() => setL2(false)}>
            Forrige
          </Button>

          <Button appearance='primary' disabled={l2} onClick={() => setL2(true)}>
            Neste
          </Button>
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
            <MenuItem>Opprett idé</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      <Dialog
        modalType='non-modal'
        open={open}
        onOpenChange={(event, data) => {
          setOpen(data.open)
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Mine bestillinger</DialogTitle>
            <DialogContent>
              <ProvisionStatus />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
