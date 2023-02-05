# body-tracking-web
 A collection of AI based body tracking utils

Visit the [app](https://lucaciucci.github.io/body-tracking-web/app/) to see the current state of the project.

A detailed description of the project can be found in the [docs](https://lucaciucci.github.io/body-tracking-web/).

# Building

## Requirements

Install the following tools:
- [Node.js](https://nodejs.org/en/)
- [Visual Studio Code](https://code.visualstudio.com/) (optional) for development

## Setup

You have to install the Node dependencies:

```bash
npm install
```

this will take about 30 seconds, check that the process is completed without errors.

## Running the app

To run the app, you have to start the React development server:

```bash
npm start
```

This will open a browser window with the app running, if you make changes to the code, you will see the changes reflected in the browser.

## Building the app

When you are satisfied with the app, you can build it for deployment.

To build the app, you have to run the following command:

```bash
npm run build
```

This will create a `build` folder with the app ready to be deployed. For example, the GitHub Pages [action](./.github/workflows/jekyll-gh-pages-and-app.yml) will simply take the `build` folder and deploy it to the website under the `app/` folder.

## Contributing

If you want to contribute to the project, please read the [contributing guidelines](./CONTRIBUTING.md).