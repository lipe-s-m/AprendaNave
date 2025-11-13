const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../src/environments/environment.prod.ts");
const apiUrl = process.env.API_URL_PROD;

if (!apiUrl) {
  console.error("❌ Variável API_URL_PROD não encontrada!");
  process.exit(1);
}

let content = fs.readFileSync(envPath, "utf8");
content = content.replace(/http:\/\/localhost:5269/g, apiUrl);
fs.writeFileSync(envPath, content, "utf8");

console.log("✅ environment.prod.ts atualizado com API_URL_PROD =", apiUrl);
