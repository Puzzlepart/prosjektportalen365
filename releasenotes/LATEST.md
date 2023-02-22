# Prosjektportalen 365 - 1.8.0 (Februar 2023)

**Versjon 1.8.0** adresserer følgende [issues](https://github.com/Puzzlepart/prosjektportalen365/issues?q=is%3Aissue+is%3Aclosed+milestone%3A1.8).

**Nedlasting**: [v1.8.0](https://github.com/Puzzlepart/prosjektportalen365/releases)

---

Velkommen til versjon 1.8.0 av Prosjektportalen 365. Det er flere grunnleggende endringer i løsningen som gjør det verdt å oppgardere til siste versjon. Her er noen av høydepunktene:

- **[Bygg- og anleggsmodulen](#bygg--og-anleggsmodulen)** - Modulen er nå en del av standardpakken
- **[Flere planner planer](#flere-planner-planer)** - Opprett prosjekter med flere planner planer per prosjekt
- **['Tilgang til'-vertikal på forsiden](#tilgang-til-vertikal-på-forsiden)** - Mulighet for å se alle prosjekter du har tilgang til
- **[Statusrapport i prosjektinformasjon](#statusrapport-i-prosjektinformasjon)** - Kjente ikoner fra statusrapport vises nå på prosjektforsiden
- **[Søkeboks i prosjektoppsett dialog](#søkeboks-i-prosjektoppsett-dialog)** - Det er nå støtte for søk i prosjektoppsett dialog

## Bygg- og anleggsmodulen

Bygg- og anleggsmodulen er nå tatt inn som en integrert del av Prosjektportalen 365. Det innebærer at denne blir automatisk installert når Prosjektportalen 365 installeres.

For kunder som skal oppgradere fra tidligere versjon, må følgende parameter legges til for å få med standardinnholdet i Bygg- og anleggsmodulen. `-IncludeBAContent`

![image](./assets/ba-mal.png)

## Flere planner planer

Man kan nå ha mer enn 1 Planner for hvert prosjekt. Dette kan gjøres på to måter: 

1. Opprette 2 ulike mallister som danner utgangspunkt for 2 plannere dersom man ønsker de opprettet med standard innhold.  

   - Viktig å huske på å legge til flere sider også 

2. Opprette manuelt i etterkant av at prosjektet er opprettet 

   - I de tilfeller hvor man for eksempel vil skille standard prosjektoppgaver som kommer fra Prosjektveiviseren fra "løse/ frie" oppgaver som tilhører prosjektet 

## FNs bærekraftsmål

Det er nå mulig å knytte nye prosjekter opp mot `FNs bærekraftsmål`. Dette gjøres ved å redigere prosjektinformasjonen.

![image](./assets/fns-baerekraftsmal.png)

## 'Tilgang til'-vertikal på forsiden

## Statusrapport i prosjektinformasjon

## Etiketter på prosjektleveranser

Det er mulig å vise etiketter for Prosjektleveranser på prosjektets tidslinje

## Søkeboks i Prosjektoppsett dialog

## Konfigurasjon av tekstfarge på prosjekttidslinje

Støtte for selvvalgte tekstfarger i prosjekttidslinje
