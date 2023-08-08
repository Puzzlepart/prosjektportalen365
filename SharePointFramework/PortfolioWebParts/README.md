# Portfolio web parts

_Published to **npm** as `pp365-portfoliowebparts`_

## PortfolioAggregation

Web part for dynamically presenting data from different sources specified in the data sources list (available through the configuration page).

This web part is used on the risk overview, deliveries overview and experience log pages.

### Initial setup

When you add the web part the first time, you need to specify a data source name:

![image-20210219110017427](assets/image-20210219110017427.png)


Edit the web part and set the property **Datakilde**:

<img src="assets/image-20210219110113413.png" alt="image-20210219110113413" style="zoom:80%;" />


You can also adjust some other settings:

![image-20210219110133325](assets/image-20210219110133325.png)



When you've set a data source (**Datakilde**), some data should be visible (if available).

### Adding custom columns

You'll only have the project name / site name at first, so you need to add more columns. When in edit mode, a column header with **Legg til kolonne** will be visible to the right (_just like in modern SharePoint lists_).

![image-20210219110311816](assets/image-20210219110311816.png)



Click the column header to open the column panel:


![image-20210219110437180](assets/image-20210219110437180.png)



### Adjusting columns

When in edit mode, you'll get some additional commands in the column context menu.

![image-20210219110649076](assets/image-20210219110649076.png)


You can move the columns to left or right, or edit the column.

### Deleting columns

When editing a column, you'll have the possiblity to delete the column.

![image-20210219110744959](assets/image-20210219110744959.png)

## Serve

- Take a copy of `config/serve.sample.json` and name it `serve.json`
- Run `npm run serve`