const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const toml = require("@iarna/toml");
const PackageJson = require("@npmcli/package-json");
const YAML = require("yaml");

const cleanupCypressFiles = (filesEntries) =>
  filesEntries.flatMap(([filePath, content]) => {
    const newContent = content
      .replace("npx ts-node", "node")
      .replace("create-user.ts", "create-user.js")
      .replace("delete-user.ts", "delete-user.js");

    return [fs.writeFile(filePath, newContent)];
  });

const cleanupDeployWorkflow = (deployWorkflow, deployWorkflowPath) => {
  delete deployWorkflow.jobs.typecheck;
  deployWorkflow.jobs.deploy.needs = deployWorkflow.jobs.deploy.needs.filter(
    (need) => need !== "typecheck"
  );

  return [fs.writeFile(deployWorkflowPath, YAML.stringify(deployWorkflow))];
};

const cleanupVitestConfig = (vitestConfig, vitestConfigPath) => {
  const newVitestConfig = vitestConfig.replace(
    "setup-test-env.ts",
    "setup-test-env.js"
  );

  return [fs.writeFile(vitestConfigPath, newVitestConfig)];
};

const escapeRegExp = (string) =>
  // $& means the whole matched string
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRandomString = (length) => crypto.randomBytes(length).toString("hex");

const readFileIfNotTypeScript = (
  isTypeScript,
  filePath,
  parseFunction = (result) => result
) =>
  (isTypeScript ? Promise.resolve() : fs.readFile(filePath, "utf-8")).then(
    parseFunction
  );

const removeUnusedDependencies = (dependencies, unusedDependencies) =>
  Object.fromEntries(
    Object.entries(dependencies).filter(
      ([key]) => !unusedDependencies.includes(key)
    )
  );

const updatePackageJson = ({ APP_NAME, isTypeScript, packageJson }) => {
  const {
    devDependencies,
    prisma: { seed: prismaSeed, ...prisma },
    scripts: { typecheck, validate, ...scripts },
  } = packageJson.content;

  packageJson.update({
    name: APP_NAME,
    devDependencies: isTypeScript
      ? devDependencies
      : removeUnusedDependencies(devDependencies, [
          "ts-node",
          "vite-tsconfig-paths",
        ]),
    prisma: isTypeScript
      ? prisma
      : {
          ...prisma,
          seed: prismaSeed
            .replace("ts-node", "node")
            .replace("seed.ts", "seed.js"),
        },
    scripts: isTypeScript
      ? { ...scripts, typecheck, validate }
      : { ...scripts, validate: validate.replace(" typecheck", "") },
  });
};

const main = async ({ isTypeScript, packageManager, rootDirectory }) => {
  const README_PATH = path.join(rootDirectory, "README.md");
  const FLY_TOML_PATH = path.join(rootDirectory, "fly.toml");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const DEPLOY_WORKFLOW_PATH = path.join(
    rootDirectory,
    ".github",
    "workflows",
    "deploy.yml"
  );
  const DOCKERFILE_PATH = path.join(rootDirectory, "Dockerfile");
  const CYPRESS_SUPPORT_PATH = path.join(rootDirectory, "cypress", "support");
  const CYPRESS_COMMANDS_PATH = path.join(CYPRESS_SUPPORT_PATH, "commands.js"); // We renamed this during `create-remix`
  const CREATE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    "create-user.js"
  ); // We renamed this during `create-remix`
  const DELETE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    "delete-user.js"
  ); // We renamed this during `create-remix`
  const VITEST_CONFIG_PATH = path.join(rootDirectory, "vitest.config.js"); // We renamed this during `create-remix`

  const REPLACER = "indie-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME = (DIR_NAME + "-" + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const [
    prodContent,
    readme,
    env,
    dockerfile,
    cypressCommands,
    createUserCommand,
    deleteUserCommand,
    deployWorkflow,
    vitestConfig,
    packageJson,
  ] = await Promise.all([
    fs.readFile(FLY_TOML_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    fs.readFile(DOCKERFILE_PATH, "utf-8"),
    readFileIfNotTypeScript(isTypeScript, CYPRESS_COMMANDS_PATH),
    readFileIfNotTypeScript(isTypeScript, CREATE_USER_COMMAND_PATH),
    readFileIfNotTypeScript(isTypeScript, DELETE_USER_COMMAND_PATH),
    readFileIfNotTypeScript(isTypeScript, DEPLOY_WORKFLOW_PATH, (s) =>
      YAML.parse(s)
    ),
    readFileIfNotTypeScript(isTypeScript, VITEST_CONFIG_PATH),
    PackageJson.load(rootDirectory),
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

  const lockfile = {
    npm: "package-lock.json",
    yarn: "yarn.lock",
    pnpm: "pnpm-lock.yaml",
  }[packageManager];

  const newDockerfile = lockfile
    ? dockerfile.replace(
        new RegExp(escapeRegExp("ADD package.json"), "g"),
        `ADD package.json ${lockfile}`
      )
    : dockerfile;

  updatePackageJson({ APP_NAME, isTypeScript, packageJson });

  const fileOperationPromises = [
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(DOCKERFILE_PATH, newDockerfile),
    packageJson.save(),
    fs.copyFile(
      path.join(rootDirectory, "remix.init", "gitignore"),
      path.join(rootDirectory, ".gitignore")
    ),
    fs.rm(path.join(rootDirectory, ".github", "ISSUE_TEMPLATE"), {
      recursive: true,
    }),
    fs.rm(path.join(rootDirectory, ".github", "PULL_REQUEST_TEMPLATE.md")),
  ];

  if (!isTypeScript) {
    fileOperationPromises.push(
      ...cleanupCypressFiles([
        [CYPRESS_COMMANDS_PATH, cypressCommands],
        [CREATE_USER_COMMAND_PATH, createUserCommand],
        [DELETE_USER_COMMAND_PATH, deleteUserCommand],
      ])
    );

    fileOperationPromises.push(
      ...cleanupDeployWorkflow(deployWorkflow, DEPLOY_WORKFLOW_PATH)
    );

    fileOperationPromises.push(
      ...cleanupVitestConfig(vitestConfig, VITEST_CONFIG_PATH)
    );
  }

  await Promise.all(fileOperationPromises);

  execSync("npm run setup", { cwd: rootDirectory, stdio: "inherit" });

  execSync("npm run format -- --loglevel warn", {
    cwd: rootDirectory,
    stdio: "inherit",
  });

  console.log(
    `Setup is complete. You're now ready to rock and roll 🤘

Start development with \`npm run dev\`
    `.trim()
  );
};

module.exports = main;
