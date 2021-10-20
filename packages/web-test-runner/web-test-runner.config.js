process.env.NODE_ENV = 'test';
const vite = require("vite-web-test-runner-plugin");
const { playwrightLauncher } = require('@web/test-runner-playwright');

const ignoredBrowserLogs = [
  '[vite] connecting...',
  '[vite] connected.',
];

module.exports = {
  testFramework: {
    config: {
      timeout: '3600000', // 1 hour
    },
  },
  testsFinishTimeout: 3600000, // 1 hour
  coverageConfig: {
    include: [
      'src/**/*.{js,jsx,ts,tsx}'
    ],
  },
  plugins: [vite()],
  testRunnerHtml: testFramework => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script type="module">
          // Note: globals expected by @testing-library/react
          window.global = window;
          window.process = { env: {} };
          // Note: adapted from https://github.com/vitejs/vite/issues/1984#issuecomment-778289660
          // Note: without this you'll run into https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <script type="module" src="${testFramework}"></script>
      </head>
    </html>
  `,
  filterBrowserLogs: ({ args }) => {
    return !args.some((arg) => ignoredBrowserLogs.includes(arg));
  },
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      launchOptions: {
        headless: false,
        devtools: false
      },
    }),
    // playwrightLauncher({
    //   product: 'firefox',
    //   launchOptions: {
    //     headless: true,
    //     devtools: false
    //   },
    // }),
    // playwrightLauncher({
    //   product: 'webkit',
    //   launchOptions: {
    //     headless: true,
    //     devtools: false
    //   },
    // }),
  ]
};