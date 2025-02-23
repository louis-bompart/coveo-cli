# Atomic

This project was generated with [@coveo/create-atomic](https://npmjs.com/package/@coveo/create-atomic).

## Setup environment

The root folder should contain a `.env` file. Replace all placeholder variables (`<...>`) by the proper information for your organization. Consult the example configuration file named `.env.example` as needed. For more involved configurations, you can modify the request parameters used in the `lambda/functions/token/token.ts` file.

### CDN

By default, the project installs the latest major Atomic version, v1, to allow types and more advanced customizations. [Coveo Headless](https://www.npmjs.com/package/@coveo/headless) is also bundled with Atomic and accessible at `@coveo/atomic/headless`.

When running, the app will use the bundled Atomic, but using the CDN is a viable option, just make sure you're using the same minor version of Atomic as the one bundled. It could cause issues with your custom components if the minor version differs.
E.g., if you have @coveo/atomic@1.44.0 installed, use the following CDN link at path [https://static.cloud.coveo.com/atomic/v1.44/](https://static.cloud.coveo.com/atomic/v1.44/atomic.esm.js).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode, launching the [Netlify CLI dev command](https://cli.netlify.com/commands/dev).
Open [http://localhost:8888](http://localhost:8888) to view it in the browser.

The page will reload if you make edits.

This command will also start a serverless lambda function that will generate [Coveo search tokens](https://docs.coveo.com/en/1346/) at [http://localhost:8888/.netlify/functions/token](http://localhost:8888/.netlify/functions/token).
_See [@coveo/search-token-lambda](https://www.npmjs.com/package/@coveo/search-token-lambda)_

### `npm run dev:live`

Runs the app in the development mode and provides a shareable link for collaborators, launching the [Netlify CLI dev live command](https://cli.netlify.com/commands/dev).

### `npm run build`

Builds the [Stencil](https://stenciljs.com/docs/cli) project for production.

### `npm run site:init`

Configure continuous or manual deployment for a new or existing site, launching the [Netlify CLI init command](https://cli.netlify.com/commands/init).

### `npm run site:deploy`

Builds the app for production and manually deploys the `www` folder to the linked Netlify site, launching the [Netlify CLI deploy command](https://cli.netlify.com/commands/deploy).

## Learn More

To learn more about Atomic, check out the [Atomic documentation](https://docs.coveo.com/en/atomic/latest/).
