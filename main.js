const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

function getTextOrBool(s) {
  if (s === "TRUE") return true;
  if (s === "FALSE") return false;
  return s;
}

function addCssClasses(table) {
  let tableStandardVsPremium = false;
  let tableStandardVsDeluxe = false;
  let tableStandardVsEnterprise = false;
  let tablePremiumVsDeluxe = false;
  let tablePremiumVsEnterprise = false;
  let tableDeluxeVsEnterprise = false;

  table.items.forEach(item => {
    let standardVsPremium = false;
    let standardVsDeluxe = false;
    let standardVsEnterprise = false;
    let premiumVsDeluxe = false;
    let premiumVsEnterprise = false;
    let deluxeVsEnterprise = false;

    if (item.standard !== item.premium) {
      standardVsPremium = true;
      tableStandardVsPremium = true;
    }

    if (item.standard !== item.deluxe) {
      standardVsDeluxe = true;
      tableStandardVsDeluxe = true;
    }

    if (item.standard !== item.enterprise) {
      standardVsEnterprise = true;
      tableStandardVsEnterprise = true;
    }

    if (item.premium !== item.deluxe) {
      premiumVsDeluxe = true;
      tablePremiumVsDeluxe = true;
    }

    if (item.premium !== item.enterprise) {
      premiumVsEnterprise = true;
      tablePremiumVsEnterprise = true;
    }

    if (item.deluxe !== item.enterprise) {
      deluxeVsEnterprise = true;
      tableDeluxeVsEnterprise = true;
    }

    item.cellClass = `${standardVsPremium ? "$cell_standard_vs_premium" : ""} ${
      standardVsDeluxe ? "$cell_standard_vs_deluxe" : ""
    } ${standardVsEnterprise ? "$cell_standard_vs_enterprise" : ""} ${
      premiumVsDeluxe ? "$cell_premium_vs_deluxe" : ""
    } ${premiumVsEnterprise ? "$cell_premium_vs_enterprise" : ""} ${
      deluxeVsEnterprise ? "$cell_deluxe_vs_enterprise" : ""
    }`;

    item.rowClass =
      standardVsPremium ||
      standardVsDeluxe ||
      standardVsEnterprise ||
      premiumVsDeluxe ||
      premiumVsEnterprise ||
      deluxeVsEnterprise
        ? "$row_difference"
        : "";
  });

  table.tableClass = `
    ${
      tableStandardVsPremium ||
      tableStandardVsDeluxe ||
      tableStandardVsEnterprise ||
      tablePremiumVsDeluxe ||
      tablePremiumVsEnterprise ||
      tableDeluxeVsEnterprise
        ? "$table_desktop"
        : ""
    } ${tableStandardVsPremium ? "$table_standard_vs_premium" : ""} ${
    tableStandardVsDeluxe ? "$table_standard_vs_deluxe" : ""
  } ${tableStandardVsEnterprise ? "$table_standard_vs_enterprise" : ""} ${
    tablePremiumVsDeluxe ? "$table_premium_vs_deluxe" : ""
  } ${tablePremiumVsEnterprise ? "$table_premium_vs_enterprise" : ""} ${
    tableDeluxeVsEnterprise ? "$table_deluxe_vs_enterprise" : ""
  }
  `;
}

function whitespaceHandler(stringOrBool) {
  if (typeof stringOrBool === "boolean") {
    return stringOrBool;
  }

  let s = stringOrBool;

  s = s.replaceAll("z. B.", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("E-Mails", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("E-Mail", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("DSGVO-konform", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("%", "<span class='whitespace-nowrap'> $&</span>");
  s = s.replaceAll("E-Mail-Builder", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("Campaign-Builder", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("Landingpage-Builder", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("„An primäre E-Mail-Adresse“", "<span class='whitespace-nowrap'>$&</span>");
  s = s.replaceAll("„An alle E-Mail-Adressen“", "<span class='whitespace-nowrap'>$&</span>");
  return s;
}

function csvToPhpArray(inputFilePath, outputFilePath) {
  // Validate file existence and extension
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  if (path.extname(inputFilePath).toLowerCase() !== ".csv") {
    throw new Error("File must be a CSV file");
  }

  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(inputFilePath)
      .pipe(csv())
      .on("data", data => results.push(data))
      .on("end", () => {
        const tables = [];
        let table = {};
        results.forEach((item, index) => {
          if (item.type === "heading") {
            // push table in data if not empty (first one)
            if (Object.keys(table).length > 0) {
              tables.push(table);
            }
            // reset table data
            table = {};
            table.items = [];
            table.heading = item["Feature"];
            table.kiBadge = item["ki_badge"] === "TRUE";
            table.newBadge = item["new_badge"] === "TRUE";
          } else {
            // we're dealing with a row
            const newItem = {};
            newItem.label = whitespaceHandler(item["Feature"]);
            newItem.tooltip = whitespaceHandler(item["Tooltip"]);
            newItem.standard = whitespaceHandler(getTextOrBool(item["Standard"]));
            newItem.premium = whitespaceHandler(getTextOrBool(item["Premium"]));
            newItem.deluxe = whitespaceHandler(getTextOrBool(item["Deluxe"]));
            newItem.enterprise = whitespaceHandler(getTextOrBool(item["Enterprise"]));
            newItem.kiBadge = getTextOrBool(item["ki_badge"]);
            newItem.newBadge = getTextOrBool(item["new_badge"]);
            newItem.initiallyHidden = getTextOrBool(item["hide_on_mobile"]);

            table.items.push(newItem);
          }

          if (index === results.length - 1) {
            // push the last table
            if (Object.keys(table).length > 0) {
              tables.push(table);
            }
          }
        });

        let php = "<?php\n\n";
        php += "// DO NOT manually modify this file.\n";
        php += "// This file was generated using https://github.com/C-Mejlak/csv-to-features\n";
        php +=
          "// To make changes modify https://docs.google.com/spreadsheets/d/1vnX5QtyCgLZUGgU-lhkndyBzpuzbzUlOIRq5O26N9MI/edit?gid=1367493046#gid=1367493046 \n";
        php += "// and run it through this script.\n\n";

        php += '$table_desktop = "features-table__table--different-desktop";\n';
        php += '$table_standard_vs_premium = "features-table__table--different-standard-vs-premium";\n';
        php += '$table_standard_vs_deluxe = "features-table__table--different-standard-vs-deluxe";\n';
        php += '$table_standard_vs_enterprise = "features-table__table--different-standard-vs-enterprise";\n';
        php += '$table_premium_vs_deluxe = "features-table__table--different-premium-vs-deluxe";\n';
        php += '$table_premium_vs_enterprise = "features-table__table--different-premium-vs-enterprise";\n';
        php += '$table_deluxe_vs_enterprise = "features-table__table--different-deluxe-vs-enterprise";\n';
        php += '$row_difference = "features-table__row--different";\n';
        php += '$cell_standard_vs_premium = "features-table__cell--different-standard-vs-premium";\n';
        php += '$cell_standard_vs_deluxe = "features-table__cell--different-standard-vs-deluxe";\n';
        php += '$cell_standard_vs_enterprise = "features-table__cell--different-standard-vs-enterprise";\n';
        php += '$cell_premium_vs_deluxe = "features-table__cell--different-premium-vs-deluxe";\n';
        php += '$cell_premium_vs_enterprise = "features-table__cell--different-premium-vs-enterprise";\n';
        php += '$cell_deluxe_vs_enterprise = "features-table__cell--different-deluxe-vs-enterprise";\n';

        php += `$features_total_count = ${tables.reduce((acc, table) => acc + table.items.length, 0)};\n`;
        php += "$feature_tables = [\n";
        tables.forEach(table => {
          table.items.forEach(item => {
            item.standard = typeof item.standard === "boolean" ? item.standard : `"${item.standard}"`;
            item.premium = typeof item.premium === "boolean" ? item.premium : `"${item.premium}"`;
            item.deluxe = typeof item.deluxe === "boolean" ? item.deluxe : `"${item.deluxe}"`;
            item.enterprise = typeof item.enterprise === "boolean" ? item.enterprise : `"${item.enterprise}"`;
          });
        });

        tables.forEach(table => {
          addCssClasses(table);
          php += "[\n";
          php += `"heading" => "${table.heading}",
                  "ki_badge" => ${table.kiBadge},
                  "new_badge" => ${table.newBadge},
                  "table_class" => "${table.tableClass.trim()}",
                  "items" => [
          `;

          table.items.forEach(item => {
            php += `[
              "label" => "${item.label}",
              "tooltip" => "${item.tooltip}",
              "standard" => ${item.standard},
              "premium" => ${item.premium},
              "deluxe" => ${item.deluxe},
              "enterprise" => ${item.enterprise},
              "ki_badge" => ${item.kiBadge},
              "new_badge" => ${item.newBadge},
              "row_class" => "${item.rowClass.trim()}",
              "cell_class" => "${item.cellClass.trim()}",
              "initially_hidden" => ${item.initiallyHidden}
            ],\n`;
          });
          php += "],"; // close items
          php += "],\n"; // close table
        });
        php += "];\n"; // close $feature_tables
        php += "return [\n";
        php += '"feature_tables" => $feature_tables,\n';
        php += '"features_total_count" => $features_total_count\n';
        php += "];\n";

        if (outputFilePath) {
          try {
            fs.writeFileSync(outputFilePath, php);
          } catch (writeError) {
            reject(new Error(`Error writing to output file: ${writeError.message}`));
            return;
          }
        }

        resolve(php);
      })
      .on("error", error => reject(error));
  });
}

// Allow script to be run from command line
async function main() {
  // Check if file path is provided
  if (process.argv.length < 3) {
    console.error("Usage: node csv-to-php-array.js <path_to_csv_file>");
    process.exit(1);
  }

  try {
    // Convert CSV to PHP array
    const inputFilePath = process.argv[2];
    const outputFilePath = process.argv[3];
    await csvToPhpArray(inputFilePath, outputFilePath);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Only run main if this file is being executed directly
if (require.main === module) {
  main();
}

module.exports = csvToPhpArray;
