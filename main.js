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
  let standardVsPremium = false;
  let standardVsDeluxe = false;
  let standardVsEnterprise = false;
  let premiumVsDeluxe = false;
  let premiumVsEnterprise = false;
  let deluxeVsEnterprise = false;

  table.allItems.forEach(item => {
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

    item.rowClass = `${
      standardVsPremium ||
      standardVsDeluxe ||
      standardVsEnterprise ||
      premiumVsDeluxe ||
      premiumVsEnterprise ||
      deluxeVsEnterprise
        ? "$row_difference"
        : ""
    }`;
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
            table.allItems = [];
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

            table.allItems.push(newItem);
          }

          if (index === results.length - 1) {
            // push the last table
            if (Object.keys(table).length > 0) {
              tables.push(table);
            }
          }
        });

        let php = "<?php\n$feature_tables = [";
        tables.forEach(table => {
          addCssClasses(table);
          table.items = table.allItems.filter(item => !item.initiallyHidden);
          table.itemsInitiallyHidden = table.allItems.filter(item => item.initiallyHidden);
          php += "[";
          php += `"heading" => "${table.heading}",
                  "ki_badge" => ${table.kiBadge},
                  "new_badge" => ${table.newBadge},
                  "table_class" => "${table.tableClass.trim()}",
                  "items" => [
          `;

          table.items.forEach(item => {
            const standard = typeof item.standard === "boolean" ? item.standard : `"${item.standard}"`;
            const premium = typeof item.premium === "boolean" ? item.premium : `"${item.premium}"`;
            const deluxe = typeof item.deluxe === "boolean" ? item.deluxe : `"${item.deluxe}"`;
            const enterprise = typeof item.enterprise === "boolean" ? item.enterprise : `"${item.enterprise}"`;
            php += `[
              "label" => "${item.label}",
              "tooltip" => "${item.tooltip}",
              "standard" => ${standard},
              "premium" => ${premium},
              "deluxe" => ${deluxe},
              "enterprise" => ${enterprise},
              "row_class" => "${item.rowClass.trim()}",
              "cell_class" => "${item.cellClass.trim()}"
            ],`;
          });
          php += "],"; // close items
          php += `"items_initially_hidden" => [\n`;
          table.itemsInitiallyHidden.forEach(item => {
            const standard = typeof item.standard === "boolean" ? item.standard : `"${item.standard}"`;
            const premium = typeof item.premium === "boolean" ? item.premium : `"${item.premium}"`;
            const deluxe = typeof item.deluxe === "boolean" ? item.deluxe : `"${item.deluxe}"`;
            const enterprise = typeof item.enterprise === "boolean" ? item.enterprise : `"${item.enterprise}"`;
            php += `[
                "label" => "${item.label}",
                "tooltip" => "${item.tooltip}",
                "standard" => ${standard},
                "premium" => ${premium},
                "deluxe" => ${deluxe},
                "enterprise" => ${enterprise},
                "row_class" => "${item.rowClass.trim()}",
                "cell_class" => "${item.cellClass.trim()}"
              ],`;
          });
          php += "]"; // close item_initially_hidden
          php += "],"; // close table
        });
        php += "];"; // close $feature_tables

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
    const phpArray = await csvToPhpArray(inputFilePath, outputFilePath);
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
