# Manglende Title FieldRef øverst i ContentType-skjemaer i JSON-maler

### Beskriv feilen

En feil har oppstått der flere ContentTypes definert i JSON-malene under [Templates/JsonTemplates/](../../Templates/JsonTemplates/) mangler en `Title`-FieldRef øverst i sin `FieldRefs`-liste. Dette gjør at `Title`-kolonnen ikke vises som første felt i skjemaer og visninger når disse ContentTypene bindes til lister (Template 100 – vanlige lister), i motsetning til det mønsteret som brukes i XML-baserte ContentType-definisjoner i [Templates/Portfolio/Objects/ContentTypes/](../../Templates/Portfolio/Objects/ContentTypes/) (f.eks. `Tillatelseskonfigurasjonselement.xml`, `Prosjekt.xml`) hvor `<pnp:FieldRef Name="Title" />` alltid er første element i `<pnp:FieldRefs>`.

Berørte ContentTypes i både `_JsonTemplateProject.json` og `_JsonTemplateProgram.json`:

- Uncertainty (`0x0100A87AE71CBF2643A6BC9D0948BD2EE897`)
- Stakeholder (`0x010072C95831F8434782AB2FF6BE3E596F46`)
- CommunicationElement (`0x010065CE65D51354419EA794C6FACD4FA2EB`)
- Checkpoint (`0x0100486B1F8AEA24486FBA1C1BA9146C360C`)
- ProjectDelivery (`0x0100D7B74DE815F946D3B0F99D19F9B36B68`)
- ProjectLogElement (`0x01004EDD18CB92C14EBA97103D909C897810`)
- ProjectTask (`0x01080024FEF2F7FA284B7CB33E6635D636E380`)
- BenefitFollowup (`0x010039EAFDC2A1624C1BA1A444FC8FE85DEC`)
- Benefit (`0x01004F466123309D46BAB9D5C6DE89A6CF67`)
- Change (`0x01001AF93A93F5534B5FBAF750572B11BB7F`)
- MeasureIndicator (`0x010073043EFE3E814A2BBEF96B8457623F95`)

`ResourceAllocation` (`0x010004EAFF7AFCC94C2680042E6881264120`) har allerede `Title` korrekt øverst og brukes som referansemønster.

### Hvordan reprodusere feilen

Trinn for å gjenskape:

 1. Gå til `Templates/JsonTemplates/_JsonTemplateProject.json` (eller `_JsonTemplateProgram.json`)
 2. Klikk på en av de berørte ContentType-definisjonene, f.eks. `Uncertainty` (linje 9–73)
 3. Scroll ned til `FieldRefs`-arrayet
 4. Se feil: første FieldRef er `GtRiskDescription`, ikke `Title`. Det samme gjelder de øvrige ContentTypene listet over.

Sammenlign med XML-malen `Templates/Portfolio/Objects/ContentTypes/Tillatelseskonfigurasjonselement.xml` der `Title` (ID `fa564e0f-0c70-4ab9-b863-0177e6ddd247`) alltid er første `<pnp:FieldRef>`.

### Forventet oppførsel

Alle ContentTypes som har en `FieldRefs`-array i JSON-malene skal starte med en `Title`-FieldRef:

```json
{
    "ID": "fa564e0f-0c70-4ab9-b863-0177e6ddd247",
    "Name": "Title"
},
```

Dette gjelder for ContentTypes som bindes til lister av Template 100 (vanlige lister). For dokumentbibliotek (Template 101) bør det første feltet være `FileLeafRef`/`LinkFilename`. ContentTypes som arver fra en annen ContentType og ikke har egen `FieldRefs`-array (Risk, Possibility, ProjectEvent) berøres ikke siden de arver feltdefinisjonene.

### Skjermbilder

_No response_

### Ytterligere informasjon

Fiksen er allerede anvendt og legger til Title-FieldRef øverst i `FieldRefs` for 11 ContentTypes i hver av filene:

- [Templates/JsonTemplates/_JsonTemplateProject.json](../../Templates/JsonTemplates/_JsonTemplateProject.json)
- [Templates/JsonTemplates/_JsonTemplateProgram.json](../../Templates/JsonTemplates/_JsonTemplateProgram.json)

`_JsonTemplateParent.json` har ingen `ContentTypes`-array og er ikke berørt.

Verifisering:
- Begge filer er gyldig JSON etter endring (`node -e "JSON.parse(...)"` returnerer OK).
- Antall referanser til Title-feltets GUID (`fa564e0f-0c70-4ab9-b863-0177e6ddd247`) er nå 16 i hver fil (var 5 før endring: 1 i ResourceAllocation ContentType + 4 i list-nivå FieldRefs).

### Hvilke nettleser(e) oppleves feilen på?

_No response_

### Versjon

1.12.0 (siste stabile)

### Relevant logg

```shell

```
