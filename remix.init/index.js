const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const inquirer = require("inquirer");
const toml = require("@iarna/toml");
const PackageJson = require("@npmcli/package-json");
const JSON5 = require("json5");
const { loadTsconfig } = require("tsconfig-paths/lib/tsconfig-loader");

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

async function main({ rootDirectory, isTypeScript }) {
  const REMIX_INIT_DIR = path.join(rootDirectory, "remix.init");
  const README_PATH = path.join(rootDirectory, "README.md");
  const FLY_TOML_PATH = path.join(rootDirectory, "fly.toml");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");

  const REPLACER = "indie-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME = (DIR_NAME + "-" + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const [prodContent, readme, env, packageJson] = await Promise.all([
    fs.readFile(FLY_TOML_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    PackageJson.load(rootDirectory),
    fs.rm(path.join(rootDirectory, ".github/ISSUE_TEMPLATE"), {
      recursive: true,
    }),
    fs.rm(path.join(rootDirectory, ".github/PULL_REQUEST_TEMPLATE.md")),
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

  packageJson.update({
    name: APP_NAME,
  });

  let prismaSeed = packageJson.content.prisma?.seed;
  if (prismaSeed && !isTypeScript) {
    prismaSeed = prismaSeed.replace("seed.ts", "seed.js");
    packageJson.update({
      prisma: { seed: prismaSeed },
    });
  }

  let fileOperationPromises = [
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    packageJson.save(),
  ];

  if (!isTypeScript) {
    // we renamed this during `create-remix`
    let JSCONFIG_PATH = path.join(rootDirectory, "jsconfig.json");
    let jsconfig = loadTsconfig(JSCONFIG_PATH);
    if (jsconfig) {
      delete jsconfig.include;
      fileOperationPromises.push(
        fs.writeFile(JSCONFIG_PATH, JSON5.stringify(jsconfig, null, 2))
      );
    }

    // we renamed this during `create-remix`
    // instead of reading this file and changing it, we have a copy of it in this directory already set up for javascript
    let VITEST_CONFIG_NAME = "vitest.config.js";
    let VITEST_CONFIG_PATH = path.join(rootDirectory, VITEST_CONFIG_NAME);
    fileOperationPromises.push(
      fs.rm(VITEST_CONFIG_NAME),
      fs.rename(
        path.join(REMIX_INIT_DIR, VITEST_CONFIG_NAME),
        VITEST_CONFIG_PATH
      )
    );
  }

  await Promise.all(fileOperationPromises);

  execSync(`npm run setup`, { stdio: "inherit", cwd: rootDirectory });

  // TODO: There is currently an issue with the test cleanup script that results
  // in an error when running Cypress in some cases. Add this question back
  // when this is fixed.
  // await askSetupQuestions({ rootDirectory }).catch((error) => {
  //   if (error.isTtyError) {
  //     // Prompt couldn't be rendered in the current environment
  //   } else {
  //     throw error;
  //   }
  // });

  console.log(
    `Setup is complete. You're now ready to rock and roll 🤘

Start development with \`npm run dev\`
    `.trim()
  );
}

async function askSetupQuestions({ rootDirectory }) {
  const answers = await inquirer.prompt([
    {
      name: "validate",
      type: "confirm",
      default: false,
      message:
        "Do you want to run the build/tests/etc to verify things are setup properly?",
    },
  ]);

  if (answers.validate) {
    console.log(
      `Running the validate script to make sure everything was set up properly`
    );
    execSync(`npm run validate`, { stdio: "inherit", cwd: rootDirectory });
  }
}

module.exports = main;
