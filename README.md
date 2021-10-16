# Gherkin TestKit

A framework agnostic library for implementing Given, When, Then and parsing/validation of Gherkin feature files.

### EXPERIMENTAL - DO NOT USE IN PRODUCTION

## Overview

gherkin-testkit is a minimal, framework agnostic fork of [jest-cucumber](https://github.com/bencompton/jest-cucumber). Like Jest-Cucumber, it implements the [Cucumber.js Gherkin AST parser](https://github.com/cucumber/cucumber/tree/master/gherkin). However, to keep the implementation light, gherkin-testkit does not implement a code generator used for hinting what code is needing to be implemented if missing. It is also missing the file system functionality of `loadFeatures, loadFeature` for compatibility with testing frameworks (such as WTR) that cannot access the filesystem using native `fs` calls.

## Motivation

Jest-Cucumber is an excellent library for Jest which builds on top of Cucumber.js' Gherkin parser. The other alternative to Jest-Cucumber is Cucumber.js itself and Yadda, which uses its own syntax. Outside of these three libraries there are limited options. My need to work with [Snowpack](https://www.snowpack.dev/) means I wanted to shift to [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) / RTL / Mocha / Chai / Sinon, which caused me to create this fork. Jest-Cucumber implements Jest calls in the `feature-definition-creation.ts` file - which is where I made function calls customizable by configuration. Without configuration, it defaults to work with Mocha's calls.

## Roadmap

If possible, it would be ideal to have a single core for both Jest and other frameworks. Currently, the plan is to implement this core (or another one like it) with a test-runner-gherkin for WTR. The same may (or may not) be done for Jest.

## Example usage for WTR

The following is an example step test file:

```
import { readFile } from '@web/test-runner-commands';
import { parseFeature, defineFeature, getGherkinTestKitConfiguration } from 'gherkin-testkit';
import { expect } from 'chai';

//@ts-ignore
readFile({ path: './CloneInit.feature' }).then((content) => {
  const feature = parseFeature(content, getGherkinTestKitConfiguration({}));
  defineFeature(feature, test => {
    test('Valid URL given for something that exists in localStorage', ({
      given,
      when,
      then
    }) => {
      given('a user wants to load a project already in localStorage', () => {
        expect(true).to.equal(true);
      });
  
      when('the user enters a URL that matches', () => {
        expect(true).to.equal(true);
      });
  
      then('the system renders what is in localStorage', () => {
        expect(true).to.equal(true);
      });
    });
  });
});
```

## Step file code generation

To quickly generate step files, you can use the [Jest-Cucumber code generator](https://marketplace.visualstudio.com/items?itemName=Piotr-Porzuczek.jest-cucumber-code-generator-extension) for vscode.
