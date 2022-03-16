const fs = require("fs/promises");
const { execSync } = require("child_process");
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

async function main({ rootDirectory }) {
  const README_PATH = path.join(rootDirectory, "README.md");
  const FLY_TOML_PATH = path.join(rootDirectory, "fly.toml");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");

  const REPLACER = "indie-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
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

  console.log(`1️⃣  Setting up the database`);
  execSync(`npx prisma migrate dev`, { stdio: "inherit", cwd: rootDirectory });

  // get the build ready
  console.log("2️⃣  Running the build to verify things are working");
  execSync(`npm run build`, { stdio: "inherit", cwd: rootDirectory });

  console.log(`✅  Project is ready! Start development with "npm run dev"`);
}

module.exports = main;
