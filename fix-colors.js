import fs from "fs";
import path from "path";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk("./src");
const invalidColorRegex = /(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:border)-([a-z]+)-([1345678]50)\b/g;

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  if (invalidColorRegex.test(content)) {
    console.log(`Fixing ${file}`);
    content = content.replace(invalidColorRegex, (match, prefix, color, nuance) => {
      // 150 -> 200, 350 -> 400, 450 -> 500
      let newNuance = parseInt(nuance);
      if (newNuance === 150) newNuance = 200;
      else if (newNuance === 350) newNuance = 300;
      else if (newNuance === 450) newNuance = 400;
      else if (newNuance === 550) newNuance = 500;
      else if (newNuance === 650) newNuance = 600;
      else if (newNuance === 750) newNuance = 700;
      else if (newNuance === 850) newNuance = 800;
      return `${prefix}-${color}-${newNuance}`;
    });
    fs.writeFileSync(file, content, "utf8");
  }
});
console.log("Done");
