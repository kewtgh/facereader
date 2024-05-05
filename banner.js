const fs = require("fs");
<<<<<<< HEAD
const pkg = require("./package.json");
=======
>>>>>>> ee43a6492cd0803b09769f679d231b0bd01805e0
const filename = "assets/js/main.min.js"
const script = fs.readFileSync(filename);
const banner = fs.readFileSync("_includes/copyright.js");

if (script.slice(0, 3) != "/*!") {
  fs.writeFileSync(filename, banner + script);
}
