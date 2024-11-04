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
