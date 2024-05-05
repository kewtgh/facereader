const fs = require("fs");
const pkg = require("./package.json");
const filename = "assets/js/main.min.js"
const script = fs.readFileSync(filename);
const banner = fs.readFileSync("_includes/copyright.js");

if (script.slice(0, 3) != "/*!") {
  fs.writeFileSync(filename, banner + script);
}
