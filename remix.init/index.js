const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const PackageJson = require('@npmcli/package-json');
const semver = require('semver');

const cleanupCypressFiles = ({ fileEntries, packageManager }) =>
  fileEntries.flatMap(([filePath, content]) => {
    const newContent = content.replace(
      new RegExp('npx ts-node', 'g'),
      `${packageManager.exec} ts-node`,
    );

    return [fs.writeFile(filePath, newContent)];
  });

const escapeRegExp = (string) =>
  // $& means the whole matched string
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPackageManagerCommand = (packageManager) =>
  // Inspired by https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L38-L103
  ({
    npm: () => ({
      exec: 'npx',
      lockfile: 'package-lock.json',
      run: (script, args) => `npm run ${script} ${args ? `-- ${args}` : ''}`,
    }),
    pnpm: () => {
      const pnpmVersion = getPackageManagerVersion('pnpm');
      const includeDoubleDashBeforeArgs = semver.lt(pnpmVersion, '7.0.0');
      const useExec = semver.gte(pnpmVersion, '6.13.0');

      return {
        exec: useExec ? 'pnpm exec' : 'pnpx',
        lockfile: 'pnpm-lock.yaml',
        run: (script, args) =>
          includeDoubleDashBeforeArgs
            ? `pnpm run ${script} ${args ? `-- ${args}` : ''}`
            : `pnpm run ${script} ${args || ''}`,
      };
    },
    yarn: () => ({
      exec: 'yarn',
      lockfile: 'yarn.lock',
      run: (script, args) => `yarn ${script} ${args || ''}`,
    }),
  }[packageManager]());

const getPackageManagerVersion = (packageManager) =>
  // Copied over from https://github.com/nrwl/nx/blob/bd9b33eaef0393d01f747ea9a2ac5d2ca1fb87c6/packages/nx/src/utils/package-manager.ts#L105-L114
  execSync(`${packageManager} --version`).toString('utf-8').trim();

const getRandomString = (length) => crypto.randomBytes(length).toString('hex');

const removeUnusedDependencies = (dependencies, unusedDependencies) =>
  Object.fromEntries(
    Object.entries(dependencies).filter(
      ([key]) => !unusedDependencies.includes(key),
    ),
  );

const updatePackageJson = ({ APP_NAME, packageJson }) => {
  const {
    devDependencies,
    scripts: { ...scripts },
  } = packageJson.content;

  packageJson.update({
    name: APP_NAME,
    devDependencies: removeUnusedDependencies(
      devDependencies,
      // packages that are only used for linting the repo
      ['eslint-plugin-markdown'],
    ),
    scripts,
  });
};

const main = async ({ packageManager, rootDirectory }) => {
  const pm = getPackageManagerCommand(packageManager);

  const README_PATH = path.join(rootDirectory, 'README.md');
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, '.env.example');
  const ENV_PATH = path.join(rootDirectory, '.env');
  const CYPRESS_SUPPORT_PATH = path.join(rootDirectory, 'cypress', 'support');
  const CYPRESS_COMMANDS_PATH = path.join(CYPRESS_SUPPORT_PATH, 'commands.ts');

  const REPLACER = 'paystack-remix-template';

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME = (DIR_NAME + '-' + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, '-');

  const [readme, env, cypressCommands, packageJson] = await Promise.all([
    fs.readFile(README_PATH, 'utf-8'),
    fs.readFile(EXAMPLE_ENV_PATH, 'utf-8'),
    fs.readFile(CYPRESS_COMMANDS_PATH, 'utf-8'),
    PackageJson.load(rootDirectory),
  ]);

  const newEnv = env.replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET="${getRandomString(16)}"`,
  );

  //replacer
  const initInstructions = `
- First run this stack's \`remix.init\` script and commit the changes it makes to your project.

  \`\`\`sh
  npx remix init
  git init # if you haven't already
  git add .
  git commit -m "Initialize project"
  \`\`\`
`;

  const newReadme = readme
    .replace(new RegExp(escapeRegExp(REPLACER), 'g'), APP_NAME)
    .replace(initInstructions, '');

  updatePackageJson({ APP_NAME, packageJson });

  await Promise.all([
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    ...cleanupCypressFiles({
      fileEntries: [[CYPRESS_COMMANDS_PATH, cypressCommands]],
      packageManager: pm,
    }),
    packageJson.save(),
    fs.copyFile(
      path.join(rootDirectory, 'remix.init', 'gitignore'),
      path.join(rootDirectory, '.gitignore'),
    ),
    fs.rm(path.join(rootDirectory, '.github', 'dependabot.yml')),
    fs.rm(path.join(rootDirectory, '.github', 'PULL_REQUEST_TEMPLATE.md')),
    fs.rm(path.join(rootDirectory, 'LICENSE.md')),
  ]);

  execSync(pm.run('format', '--loglevel warn'), {
    cwd: rootDirectory,
    stdio: 'inherit',
  });

  console.log(
    `Setup is complete. You're now ready to rock and roll 🤘

Start development with \`${pm.run('dev')}\`
    `.trim(),
  );
};

module.exports = main;
