# CSV to Features

This script is a utility to help in updating text content of to the [features](https://docs.google.com/spreadsheets/u/2/d/1vnX5QtyCgLZUGgU-lhkndyBzpuzbzUlOIRq5O26N9MI/edit?gid=1367493046#gid=1367493046) on the pricing page. Download a CSV copy.

## Using this script

### Clone the repo

```shell
git clone git@github.com:C-Mejlak/csv-to-features.git
```

### Install dependencies

```shell
npm install
```

### Running the script

```shell
node main.js <input-path> <output-path>
```

Example let's say your CSV file is named `features.csv`. And it is located in the `Dowloads` directory. And you want save it as `features.php` in the `Downloads`.

```shell
node main.js ~/Downloads/features.csv ~/Downloads/features.php
```

### Copy file content

```shell
pbcopy < ~/Downloads/features.php
```

Open the file `web/app/themes/klicktipp/resources/assets/data/new-products-features.php` and replace **all** content with what you've just copied.

## Dynamic values (placeholders)

Some cells in the generated PHP file need dynamic values that cannot be stored in the CSV — for example, template counts fetched at runtime via WordPress shortcodes, or PHP variable references. To preserve these values across re-runs of the script, use **placeholder syntax** in the CSV cells.

### Supported placeholders

| Placeholder syntax | PHP output | Description |
|---|---|---|
| `{{do_shortcode:SHORTCODE}}` | `do_shortcode('SHORTCODE')` | Executes a WordPress shortcode at runtime |
| `{{var:VARNAME}}` | `$VARNAME` | References a PHP variable defined in the preamble |

### How it works

When a CSV cell contains **no placeholders**, the output is a normal double-quoted PHP string — exactly as before:

```
CSV:  Hello World
PHP:  "Hello World"
```

When a cell **does** contain placeholders, the script splits the string into static text and dynamic expressions, then joins them with PHP's concatenation operator (`.`):

```
CSV:  {{var:templates_landingpage}} Landingpage-Designvorlagen
PHP:  $templates_landingpage . " Landingpage-Designvorlagen"
```

```
CSV:  mindestens eine unserer {{do_shortcode:[get-custom-field key="klicktipp_bee_template_count_email"]}} stilvollen
PHP:  "mindestens einer unserer " . do_shortcode('[get-custom-field key="klicktipp_bee_template_count_email"]') . " stilvollen"
```

A placeholder can also be the entire cell content:

```
CSV:  {{do_shortcode:[get-custom-field key="klicktipp_bee_template_count_email"]}}
PHP:  do_shortcode('[get-custom-field key="klicktipp_bee_template_count_email"]')
```

### Preamble variables

The script automatically emits a block of PHP variable declarations before the feature tables array. These variables can be referenced via `{{var:...}}` placeholders:

| Variable | Value | Description |
|---|---|---|
| `$templates_landingpage_total` | `do_shortcode('[get-custom-field key="klicktipp_bee_template_count_page"]')` (then cleaned and cast to int) | Total landingpage templates from the professional add-on |
| `$templates_landingpage` | `30` | Number of landingpage templates included in every plan |
| `$templates_landingpage_professional` | `$templates_landingpage_total - $templates_landingpage` | Additional templates available via the professional add-on |

### Current placeholder usage in the CSV

These are the cells that currently use placeholders:

| Section | Field | Placeholder |
|---|---|---|
| Drag-and-drop-E-Mail-Builder | Feature | `{{do_shortcode:[get-custom-field key="klicktipp_bee_template_count_email"]}} Newsletter-Designvorlagen` |
| Drag-and-drop-E-Mail-Builder | Tooltip | Contains `{{do_shortcode:[get-custom-field key="klicktipp_bee_template_count_email"]}}` |
| Drag-and-drop-Landingpage-Builder | Feature | `{{var:templates_landingpage}} Landingpage-Designvorlagen` |
| Drag-and-drop-Landingpage-Builder | Feature | `{{var:templates_landingpage_professional}} weitere Landingpage-Designvorlagen` |

### Limitations

- Placeholders only work in the **Feature** (label) and **Tooltip** columns. They are not supported in the Standard/Premium/Deluxe/Enterprise value columns.
- The placeholder content must not contain text that `whitespaceHandler` would modify (e.g. `E-Mail`), because whitespace handling runs before placeholder processing. In practice this is not a concern — shortcode attributes use lowercase or HTML-safe values.
- Shortcode content must not contain single quotes, as the script wraps shortcode output in `do_shortcode('...')`.
