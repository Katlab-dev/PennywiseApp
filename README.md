# PennyWise

PennyWise is a React and Firebase personal-finance application. Firebase Authentication manages accounts and Cloud Firestore stores each user's expenses, income, budget, and savings goals.

## Live app

[Open PennyWise](https://pennywise-684df.web.app)

## Backend setup

1. Create or select a Firebase project.
2. Enable Email/Password under Firebase Authentication → Sign-in method.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env.local` and add the Firebase web-app configuration.
5. Copy `.firebaserc.example` to `.firebaserc` and replace the example project ID.
6. Install dependencies with `npm install`.
7. Deploy the backend configuration with `npm run firebase:deploy`.

The Firebase web configuration identifies the project; authorization is enforced by `firestore.rules`. The rules only allow an authenticated user to access documents below their own `users/{uid}` path and validate every supported document shape.

## Gemini assistant setup

PennyWise uses a hybrid assistant. Exact balance, spending, budget remaining, overspending, and goal-progress answers are calculated in the browser and never sent to Gemini. For broader advice, the app creates an allowlisted aggregate summary containing only:

- current-month totals and usage metrics for anonymous numbered budget categories;
- total spending that does not match one of the user's saved budget categories;
- total and category budget usage, remaining amounts, overages, and daily allowances; and
- anonymous goal percentages and relative deadline status.

The summary excludes user-created category names, raw transactions, transaction titles and notes, balance, income, Firestore IDs, account details, personal identifiers, goal names, and exact goal amounts. Before a fallback question is sent, known custom budget names, transaction titles, notes, income-source names, and goal titles are also replaced locally with safe generic labels. Gemini uses the result for PennyWise-specific explanations. Firebase AI Logic uses the stable `gemini-3.1-flash-lite` model and does not need a Gemini API key in the frontend.

Made-up planning amounts are allowed when the question clearly says they are hypothetical—for example, “Let’s say a student has R1,700.” Hypothetical requests are sent with an empty financial summary so Gemini cannot mix the fictional scenario with the signed-in user’s real PennyWise aggregates. The input filter blocks common sensitive patterns, but it cannot recognize every possible personal detail, so users are warned not to enter personal, contact, banking, identity, or authentication information.

### Temporary local API-key demo

This development-only option lets you test Gemini before configuring Firebase App Check. A small Node server binds to `127.0.0.1`, keeps the Gemini key outside the React bundle, and accepts only a question plus the strict aggregate-summary schema above. It rejects extra, raw, injected, or mathematically inconsistent data before calling Gemini. It is not a production deployment backend.

1. Revoke any key that has been shared, then create a replacement in Google AI Studio.
2. Add the replacement to `.env.local` without a `REACT_APP_` prefix:

```env
REACT_APP_AI_PROVIDER=local-proxy
GEMINI_API_KEY=your-new-private-key
GEMINI_MODEL=gemini-3.1-flash-lite
```

3. Start the server in the first terminal:

```bash
npm run ai:server
```

4. Start React in a second terminal:

```bash
npm start
```

Never place the key in `src/`, use it as a `REACT_APP_*` variable, or commit `.env.local`. When Firebase App Check is ready, change `REACT_APP_AI_PROVIDER` back to `firebase` and stop the local server.

### Firebase AI Logic production path

1. In Firebase Console, open **AI Logic**, select **Get started**, and choose the Gemini Developer API.
2. Register the web app with Firebase App Check using reCAPTCHA Enterprise.
3. Add the reCAPTCHA Enterprise site key to `REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY` in `.env.local`.
4. In the AI Logic console settings, require authenticated users and set a per-user rate limit before production.

Create an ignored `.env.production.local` on the release machine. Copy the Firebase web configuration from `.env.local`, then add:

```env
REACT_APP_AI_PROVIDER=firebase
REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY=your_production_site_key
REACT_APP_FIREBASE_APPCHECK_DEBUG=false
GENERATE_SOURCEMAP=false
```

Do not put `GEMINI_API_KEY` in the production file. Production builds fail deliberately when Firebase AI Logic is selected without a reCAPTCHA Enterprise site key.

For local App Check testing, set `REACT_APP_FIREBASE_APPCHECK_DEBUG=true`, run the app, copy the debug token printed in the browser console, and register it under App Check → Manage debug tokens. Set the value back to `false` for production.

Do not add a Gemini API key to `.env.local`. App Check helps reject calls from unverified clients, while Firebase Authentication and the AI Logic authenticated-user setting control who may call the model.

The unpaid Gemini tier may use submitted prompts and responses to improve Google products, so PennyWise blocks common sensitive-data patterns and warns users not to submit personal or banking information. The browser-side question filter is a safety aid; the allowlisted summary and server-side schema validation provide the data-minimisation boundary. A remotely hosted proxy must additionally verify Firebase Authentication and App Check tokens before consuming Gemini quota.

## Data model

```text
users/{uid}/expenses/{expenseId}
users/{uid}/income/{incomeId}
users/{uid}/goals/{goalId}
users/{uid}/budgets/current
```

## Local development

- `npm start` starts the React application.
- `npm test` runs React unit tests.
- `npm run test:rules` starts the Firestore emulator and tests the security rules.
- `npm run emulators` starts the local Firebase emulator suite.
- `npm run build` creates a production frontend build.
- `npm run firebase:deploy` deploys Firestore rules and indexes.
- `npm run firebase:preview` builds and deploys a temporary Hosting preview channel.
- `npm run firebase:deploy:hosting` builds and deploys the live Hosting site.

Never commit `.env.local` or `.firebaserc`. Both are ignored by Git.

## Create React App reference

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open http://localhost:3000 to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# Pennywise_2
