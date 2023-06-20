## Project extensions 

This solution contains SPFx extensions for the project level.

_Published to **npm** as `pp365-projectextensions`_

### ProjectSetup

Extension for configuring a new project.

Added to all projects, and removed when the configuration/setup is done.

The user selectes a template, optional extensions and settings.


#### Project template

![image-20210210212851547](assets/image-20210210212851547.png)


#### List content

![image-20210210212959283](assets/image-20210210212959283.png)


#### Settings

![image-20210210213017732](assets/image-20210210213017732.png)

### TemplateSelector

Extension for copying templates from the hub/portal site to the project site.

The templates should be stored in a library named `Malbibliotek`. This library is created when installing Prosjektportalen 365.

The library name can be overrided in the template file:

```json
{
    "Version": "1.9.0",
    "Parameters": {
        ...
        "TemplateDocumentLibrary": "My Template Library"
    },
    "Navigation": {
        ...
    }
}
```

#### Selecting templates

In the initial screen the desired templates are selected by the user. They can navigate in the folder structure like in a SharePoint library.

![image-20210210211449675](assets/image-20210210211449675.png)



#### Selecting target library and folder

In the next screen the user decides where the templates should be copied. They can navigate in the folder structure just like when selecting the templates.

![image-20210210211654080](assets/image-20210210211654080.png)

If there's more than 1 library on the project site, the user can also pick another library.

![image-20210210212421865](assets/image-20210210212421865.png)

#### Adjust file name and title

Next they can adjust the file names and titles.

![image-20210210211724583](assets/image-20210210211724583.png)

#### Follow the progress

When the user has selected their templates, selected the target folder and clicked start - progress is shown.

![image-20210210211809859](assets/image-20210210211809859.png)

### Serve

- Take a copy of `config/serve.sample.json` and name it `serve.json`
- Run `npm run serve`

### Versioning
Never update the version of this solution independently. The version is automatically kept in sync with the other packages.