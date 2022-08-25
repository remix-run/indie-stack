const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const toml = require("@iarna/toml");
const PackageJson = require("@npmcli/package-json");
const semver = require("semver");
const YAML = require("yaml");

const cleanupCypressFiles = ({ fileEntries, isTypeScript, packageManager }) =>
  fileEntries.flatMap(([filePath, content]) => {
    let newContent = content.replace(
      new RegExp("npx ts-node", "g"),
      isTypeScript ? `${packageManager.exec} ts-node` : "node"
    );

    if (!isTypeScript) {
      newContent = newContent
        .replace(new RegExp("create-user.ts", "g"), "create-user.js")
        .replace(new RegExp("delete-user.ts", "g"), "delete-user.js");
    }

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

const getPackageManagerCommand = (packageManager) =>
  // Inspired by https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L38-L103
  ({
    npm: () => ({
      exec: "npx",
      lockfile: "package-lock.json",
      run: (script, args) => `npm run ${script} ${args ? `-- ${args}` : ""}`,
    }),
    pnpm: () => {
      const pnpmVersion = getPackageManagerVersion("pnpm");
      const includeDoubleDashBeforeArgs = semver.lt(pnpmVersion, "7.0.0");
      const useExec = semver.gte(pnpmVersion, "6.13.0");

      return {
        exec: useExec ? "pnpm exec" : "pnpx",
        lockfile: "pnpm-lock.yaml",
        run: (script, args) =>
          includeDoubleDashBeforeArgs
            ? `pnpm run ${script} ${args ? `-- ${args}` : ""}`
            : `pnpm run ${script} ${args || ""}`,
      };
    },
    yarn: () => ({
      exec: "yarn",
      lockfile: "yarn.lock",
      run: (script, args) => `yarn ${script} ${args || ""}`,
    }),
  }[packageManager]());

const getPackageManagerVersion = (packageManager) =>
  // Copied over from https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L105-L114
  execSync(`${packageManager} --version`).toString("utf-8").trim();

const getRandomString = (length) => crypto.randomBytes(length).toString("hex");

const readFileIfNotTypeScript = (
  isTypeScript,
  filePath,
  parseFunction = (result) => result
) =>
  isTypeScript
    ? Promise.resolve()
    : fs.readFile(filePath, "utf-8").then(parseFunction);

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
      : removeUnusedDependencies(devDependencies, ["ts-node"]),
    prisma: isTypeScript
      ? { ...prisma, seed: prismaSeed }
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
  const pm = getPackageManagerCommand(packageManager);
  const FILE_EXTENSION = isTypeScript ? "ts" : "js";

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
  const CYPRESS_COMMANDS_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    `commands.${FILE_EXTENSION}`
  );
  const CREATE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    `create-user.${FILE_EXTENSION}`
  );
  const DELETE_USER_COMMAND_PATH = path.join(
    CYPRESS_SUPPORT_PATH,
    `delete-user.${FILE_EXTENSION}`
  );
  const VITEST_CONFIG_PATH = path.join(
    rootDirectory,
    `vitest.config.${FILE_EXTENSION}`
  );

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
    fs.readFile(CYPRESS_COMMANDS_PATH, "utf-8"),
    fs.readFile(CREATE_USER_COMMAND_PATH, "utf-8"),
    fs.readFile(DELETE_USER_COMMAND_PATH, "utf-8"),
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

  const newDockerfile = pm.lockfile
    ? dockerfile.replace(
        new RegExp(escapeRegExp("ADD package.json"), "g"),
        `ADD package.json ${pm.lockfile}`
      )
    : dockerfile;

  updatePackageJson({ APP_NAME, isTypeScript, packageJson });

  const fileOperationPromises = [
    fs.writeFile(FLY_TOML_PATH, toml.stringify(prodToml)),
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(DOCKERFILE_PATH, newDockerfile),
    ...cleanupCypressFiles({
      fileEntries: [
        [CYPRESS_COMMANDS_PATH, cypressCommands],
        [CREATE_USER_COMMAND_PATH, createUserCommand],
        [DELETE_USER_COMMAND_PATH, deleteUserCommand],
      ],
      isTypeScript,
      packageManager: pm,
    }),
    packageJson.save(),
    fs.copyFile(
      path.join(rootDirectory, "remix.init", "gitignore"),
      path.join(rootDirectory, ".gitignore")
    ),
    fs.rm(path.join(rootDirectory, ".github", "ISSUE_TEMPLATE"), {
      recursive: true,
    }),
    fs.rm(path.join(rootDirectory, ".github", "dependabot.yml")),
    fs.rm(path.join(rootDirectory, ".github", "PULL_REQUEST_TEMPLATE.md")),
  ];

  if (!isTypeScript) {
    fileOperationPromises.push(
      ...cleanupDeployWorkflow(deployWorkflow, DEPLOY_WORKFLOW_PATH)
    );

    fileOperationPromises.push(
      ...cleanupVitestConfig(vitestConfig, VITEST_CONFIG_PATH)
    );
  }

  await Promise.all(fileOperationPromises);

  execSync(pm.run("setup"), { cwd: rootDirectory, stdio: "inherit" });

  execSync(pm.run("format", "--loglevel warn"), {
    cwd: rootDirectory,
    stdio: "inherit",
  });

  console.log(
    `Setup is complete. You're now ready to rock and roll 🤘

Start development with \`${pm.run("dev")}\`
    `.trim()
  );
};

module.exports = main;
