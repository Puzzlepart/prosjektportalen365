# ProjectExtensions

Denne løsningen inneholder SPFx-utvidelser for prosjektnivået.

_Publiseres til **npm** som `pp365-projectextensions`_

## Oppsett av prosjekt

Utvidelse for konfigurering av et nytt prosjekt.

Legges til alle prosjekter, og fjernes når konfigureringen/oppsettet er ferdig.

Brukeren velger en mal, valgfrie utvidelser og innstillinger.

### Prosjektmal

![image-20210210212851547](assets/image-20210210212851547.png)

### Listeinnhold

![image-20210210212959283](assets/image-20210210212959283.png)

### Innstillinger

![image-20210210213017732](assets/image-20210210213017732.png)

## TemplateSelector

Utvidelse for kopiering av maler fra hub/portal-området til prosjektområdet.

Malene skal lagres i et bibliotek kalt `Malbibliotek`. Dette biblioteket opprettes når Prosjektportalen 365 installeres.

### Velge maler

I det første skjermbildet velger brukeren ønskede maler. De kan navigere i mappestrukturen som i et SharePoint-bibliotek.

![image-20210210211449675](assets/image-20210210211449675.png)

### Velge målbibliotek og mappe

I det neste skjermbildet bestemmer brukeren hvor malene skal kopieres. De kan navigere i mappestrukturen akkurat som når de velger malene.

![image-20210210211654080](assets/image-20210210211654080.png)

Hvis det er mer enn 1 bibliotek på prosjektområdet, kan brukeren også velge et annet bibliotek.

![image-20210210212421865](assets/image-20210210212421865.png)

### Juster filnavn og tittel

Deretter kan de justere filnavnene og titlene.

![image-20210210211724583](assets/image-20210210211724583.png)

### Følg fremdriften

Når brukeren har valgt sine maler, valgt målmappen og klikket start - vises fremdrift.

![image-20210210211809859](assets/image-20210210211809859.png)

## Serve

- Ta en kopi av `config/serve.sample.json` og gi den navnet `serve.json`
- Kjør `npm run serve`

## Versjonering

Aldri oppdater versjonen av denne løsningen uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.
