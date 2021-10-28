---
title: "精准诊断"
permalink: /docs/diagnosis/
excerpt: "Settings for configuring and customizing the theme."
layout: single
toc: true
class: wide
author_profile: false
show_date: false
---

Settings that affect your entire site can be changed in [Jekyll's configuration file](https://facereader.witbacon.com/docs/%E9%98%85%E7%9B%B8%E8%AF%86%E4%BA%BA/AI-Tuya/): `_config.yml`, found in the root of your project. If you don't have this file you'll need to copy or create one using the theme's [default `_config.yml`](https://facereader.witbacon.com/tags/) as a base.

**Note:** for technical reasons, `_config.yml` is NOT reloaded automatically when used with `jekyll serve`. If you make any changes to this file, please restart the server process for them to be applied.
{: .notice--warning}

Take a moment to look over the configuration file included with the theme. Comments have been added to provide examples and default values for most settings. Detailed explanations of each can be found below.

## Site settings

### Theme

If you're using the Ruby gem version of the theme you'll need this line to activate it:

```yaml
theme: minimal-mistakes-jekyll
```

### Skin

Easily change the color scheme of the theme using one of the provided "skins":

```yaml
minimal_mistakes_skin: "default" # "air", "aqua", "contrast", "dark", "dirt", "neon", "mint", "plum" "sunrise"
```

**Note:** If you have made edits to the theme's CSS files be sure to update [`/assets/css/main.scss`] to include `@import "minimal-mistakes/skins/{{ site.minimal_mistakes_skin | default: 'default' }}"; // skin` before the `minimal-mistakes` import.
{: .notice--warning}

#### Neon skin: `neon`

#### Neon skin: `plum`

#### Sunrise skin: `sunrise`


### Site locale

`site.locale` is used to declare the primary language for each web page within the site.

_Example:_ `locale: "en-US"` sets the `lang` attribute for the site to the _United States_ flavor of English, while `en-GB` would be for the `United Kingdom` style of English. Country codes are optional and the shorter variation `locale: "en"` is also acceptable. To find your language and country codes check this [reference table].

Properly setting the locale is important for associating localized text found in the [**UI Text**]({{ "/docs/ui-text/" | relative_url }}) data file. An improper match will cause parts of the UI to disappear (eg. button labels, section headings, etc).

**Note:** The theme comes with localized text in English (`en`, `en-US`, `en-GB`). If you change `locale` in `_config.yml` to something else, most of the UI text will go blank. Be sure to add the corresponding locale key and translated text to `_data/ui-text.yml` to avoid this.
{: .notice--warning}

### Site title

The name of your site. Is used throughout the theme in places like the site masthead and `<title>` tags.

_Example:_ `title: "My Awesome Site"`

You also have the option of customizing the separation character used in SEO-friendly page titles.

_Example:_ `title_separator: "|"` would produce page titles like `Sample Page | My Awesome Site`.

**Note:** Long site titles have been known to break the masthead layout. Avoid adding a long "tagline" to the title prevent this from happening eg. `My Awesome Site is the Best Because I Say So`.
{: .notice--warning}
