import { IProvisionField } from './types'

/**
 * Returns the default fields and configuration for the ProjectProvision component
 */
export const getDefaultFields = (): IProvisionField[] => {
  return [
    {
      order: 10,
      fieldName: 'type',
      displayName: 'Områdetype',
      description: '',
      dataType: 'site',
      required: true,
      level: 0
    },
    {
      order: 20,
      fieldName: 'name',
      displayName: 'Områdenavn',
      description: 'Velg et unikt navn som følger organisasjonens navngivningsstandarder.',
      placeholder: 'Angi et navn for området',
      dataType: 'text',
      required: true,
      level: 0
    },
    {
      order: 30,
      fieldName: 'description',
      displayName: 'Beskrivelse',
      description:
        'Beskrivelsen er valgfri, men nyttig for at folk skal forstå hva området ditt er for.',
      placeholder: 'Angi en beskrivelse for området',
      dataType: 'note',
      required: true,
      level: 0
    },
    {
      order: 40,
      fieldName: 'justification',
      displayName: 'Forretningsmessig begrunnelse',
      description: 'Beskriv hvorfor du har behov for dette området? Hva er formålet?',
      placeholder: 'Angi en forretningsmessig begrunnelse for bestillingen',
      dataType: 'note',
      required: true,
      level: 0
    },
    {
      order: 50,
      fieldName: 'owner',
      displayName: 'Eier(e)',
      description:
        'Eier(e) har full tilgang til området og kan legge til og fjerne medlemmer. Du kan legge til flere eiere senere.',
      placeholder: 'Angi brukere',
      dataType: 'userMulti',
      required: true,
      level: 0
    },
    {
      order: 60,
      fieldName: 'member',
      displayName: 'Medlem(mer)',
      description:
        'Medlem(mer) har tilgang til området basert på tillatelsene som er satt. Du kan legge til flere medlemmer senere.',
      placeholder: 'Angi brukere',
      dataType: 'userMulti',
      level: 0
    },
    {
      order: 70,
      fieldName: 'alias',
      displayName: 'Alias/navn',
      dataType: 'text',
      disabled: true,
      level: 0
    },
    {
      order: 80,
      fieldName: 'url',
      displayName: 'Områdeadresse',
      dataType: 'text',
      disabled: true,
      level: 0
    },
    {
      order: 90,
      fieldName: 'teamify',
      displayName: 'Aktivere Teams for området?',
      description:
        'Om du aktiverer Teams for området, vil et Teams-område bli opprettet og knyttet til området.',
      dataType: 'boolean',
      level: 1
    },
    {
      order: 100,
      fieldName: 'teamTemplate',
      displayName: 'Teams mal',
      description: 'Hvilken teams mal vil du bruke for området?',
      dataType: 'choice',
      level: 1
    },
    {
      order: 110,
      fieldName: 'isConfidential',
      displayName: 'Konfidensielle/sensitive data',
      description:
        'Vil konfidensielle eller sensitive data bli lagret i dette rommet? Dersom ja, må du sørge for at du har satt riktige tillatelser.',
      dataType: 'boolean',
      level: 1
    },
    {
      order: 120,
      fieldName: 'privacy',
      displayName: 'Tilgangsinnstillinger',
      description:
        'Vil konfidensielle eller sensitive data bli lagret i dette rommet? Dersom ja, må du sørge for at du har satt riktige tillatelser.',
      dataType: 'choice',
      level: 1
    },
    {
      order: 130,
      fieldName: 'externalSharing',
      displayName: 'Tillat eksterne gjester',
      description:
        'Dersom denne er aktivert, vil man kunne invitere inn og dele enkeltfiler, mapper, bibliotek o.l. med eksterne gjestebrukere. NB! Invitasjon av eksterne gjestebrukere vil først være mulig etter at gruppen/området er opprettet.',
      dataType: 'boolean',
      level: 1
    },
    {
      order: 140,
      fieldName: 'guest',
      displayName: 'Gjest(er)',
      description:
        'Gjester har begrenset tilgang til området. Du kan legge til flere gjester senere. Vennligst skriv inn en gyldig e-postadresse.',
      placeholder: 'Angi gjester',
      dataType: 'guest',
      level: 1
    },
    {
      order: 150,
      fieldName: 'language',
      displayName: 'Språk',
      dataType: 'choice',
      disabled: true,
      level: 1
    },
    {
      order: 160,
      fieldName: 'timeZone',
      displayName: 'Tidssone',
      dataType: 'choice',
      disabled: true,
      level: 1
    },
    {
      order: 170,
      fieldName: 'hubSiteTitle',
      displayName: 'Hubtilknytning',
      dataType: 'choice',
      disabled: true,
      level: 1
    }
  ]
}
