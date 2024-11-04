const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

function getTextOrBool(s) {
  if (s === "TRUE") return true;
  if (s === "FALSE") return false;
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
        const data = [];
        let table = {};
        results.forEach((item, index) => {
          if (item.type === "heading") {
            // push table in data if not empty (first one)
            if (Object.keys(table).length > 0) {
              data.push(table);
            }
            // reset table data
            table = {};
            table.items = [];
            table.heading = item.feature;
            table.kiBadge = item["ki_badge"] === "TRUE";
            table.newBadge = item["new_badge"] === "TRUE";
            table.tableClass = item["table_class"];
          } else {
            // we're dealing with a row
            const newItem = {};
            newItem.label = item["feature"];
            newItem.tooltip = item["tooltip"];
            newItem.standard = getTextOrBool(item["standard"]);
            newItem.premium = getTextOrBool(item["premium"]);
            newItem.deluxe = getTextOrBool(item["deluxe"]);
            newItem.enterprise = getTextOrBool(item["enterprise"]);
            newItem.rowClass = item["row_class"];
            newItem.cellClass = item["cell_class"];
            newItem.kiBadge = getTextOrBool(item["ki_badge"]);
            newItem.newBadge = getTextOrBool(item["new_badge"]);
            table.items.push(newItem);
          }

          if (index === results.length - 1) {
            // push the last table
            if (Object.keys(table).length > 0) {
              data.push(table);
            }
          }
        });

        let php = "<?php\n$feature_tables = [";
        data.forEach(table => {
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
          php += "]"; // close items
          php += "],"; // close table
        });
        php += "];"; // close $feature_tables

        if (outputFilePath) {
          try {
            fs.writeFileSync(outputFilePath, php);
            console.log(`PHP array written to ${outputFilePath}`);
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
    console.log(phpArray);
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
