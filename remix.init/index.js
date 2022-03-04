const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const toml = require("@iarna/toml");

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

async function main() {
  const README_PATH = path.join(__dirname, "../README.md");
  const FLY_TOML_PATH = path.join(__dirname, "../fly.toml");
  const EXAMPLE_ENV_PATH = path.join(__dirname, "../.env.example");
  const ENV_PATH = path.join(__dirname, "../.env");

  const REPLACER = "indie-stack-template";

  const DIR_NAME = path.basename(path.resolve(__dirname, ".."));
  const SUFFIX = getRandomString(2);
  const APP_NAME = DIR_NAME + "-" + SUFFIX;

  const [prodContent, readme, env] = await Promise.all([
    fs.readFile(FLY_TOML_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
  ]);

  const newEnv = env.replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET="${getRandomString(16)}"`
  );

  const prodToml = toml.parse(prodContent);
  prodToml.app = prodToml.app.replace(REPLACER, APP_NAME);

  const newReadme = readme.replace(
    new RegExp(escapeRegExp(REPLACER), "g"),
    APP_NAME
  );

  await Promise.all([
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
  ]);
}

void main();
