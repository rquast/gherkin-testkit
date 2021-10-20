import { checkThatFeatureFileAndStepDefinitionsHaveSameScenarios } from './validation/scenario-validation';
import {
  ScenarioFromStepDefinitions,
  FeatureFromStepDefinitions,
  StepFromStepDefinitions,
  ParsedFeature,
  ParsedScenario,
  Options,
  ParsedScenarioOutline
} from './models';
import {
  ensureFeatureFileAndStepDefinitionScenarioHaveSameSteps,
  matchSteps
} from './validation/step-definition-validation';
import { applyTagFilters } from './tag-filtering';

export type StepsDefinitionCallbackOptions = {
  defineStep: DefineStepFunction;
  given: DefineStepFunction;
  when: DefineStepFunction;
  then: DefineStepFunction;
  and: DefineStepFunction;
  but: DefineStepFunction;
  pending: () => void;
};

export type ScenariosDefinitionCallbackFunction = (
  defineScenario: DefineScenarioFunctionWithAliases
) => void;

export type DefineScenarioFunction = (
  scenarioTitle: string,
  stepsDefinitionCallback: StepsDefinitionCallbackFunction,
  timeout?: number
) => void;

export type DefineScenarioFunctionWithAliases = DefineScenarioFunction & {
  skip: DefineScenarioFunction;
  only: DefineScenarioFunction;
  concurrent: DefineScenarioFunction;
};

export type StepsDefinitionCallbackFunction = (
  options: StepsDefinitionCallbackOptions
) => void;
export type DefineStepFunction = (
  stepMatcher: string | RegExp,
  stepDefinitionCallback: (...args: any[]) => any
) => any;

const processScenarioTitleTemplate = (
  scenarioTitle: string,
  parsedFeature: ParsedFeature,
  options: Options,
  parsedScenario: ParsedScenario,
  parsedScenarioOutline: ParsedScenarioOutline
) => {
  if (options && options.scenarioNameTemplate) {
    try {
      return (
        options &&
        options.scenarioNameTemplate({
          featureTitle: parsedFeature.title,
          scenarioTitle: scenarioTitle.toString(),
          featureTags: parsedFeature.tags,
          scenarioTags: (parsedScenario || parsedScenarioOutline).tags
        })
      );
    } catch (err) {
      throw new Error(
        // tslint:disable-next-line:max-line-length
        `An error occurred while executing a scenario name template. \nTemplate:\n${options.scenarioNameTemplate}\nError:${err.message}`
      );
    }
  }

  return scenarioTitle;
};

const checkForPendingSteps = (
  scenarioFromStepDefinitions: ScenarioFromStepDefinitions
) => {
  let scenarioPending = false;

  scenarioFromStepDefinitions.steps.forEach((step) => {
    try {
      if (step.stepFunction.toString().indexOf('pending()') !== -1) {
        const pendingTest = new Function(`
                    let isPending = false;

                    const pending = function () {
                        isPending = true;
                    };

                    (${step.stepFunction})();

                    return isPending;
                `);

        scenarioPending = pendingTest();
      }
    } catch (err) {
      // Ignore
    }
  });

  return scenarioPending;
};

const getTestFunction = (
  skippedViaTagFilter: boolean,
  only: boolean,
  skip: boolean,
  concurrent: boolean,
  framework: string
) => {
  if (framework === 'mocha') {
    if (skip || skippedViaTagFilter) {
      return it.skip;
    } else if (only) {
      return it.only;
    } else {
      return it;
    }
  } else {
    if (skip || skippedViaTagFilter) {
      return test.skip;
    } else if (only) {
      return test.only;
    } else if (concurrent && 'concurrent' in test) {
      //@ts-ignore
      return test.concurrent;
    } else {
      return test;
    }
  }
};

const defineScenario = (
  scenarioTitle: string,
  scenarioFromStepDefinitions: ScenarioFromStepDefinitions,
  parsedScenario: ParsedScenario,
  options: {
    framework: string;
    only: boolean;
    skip: boolean;
    concurrent: boolean;
    timeout?: number | undefined;
  } = {
    framework: 'mocha',
    only: false,
    skip: false,
    concurrent: false,
    timeout: undefined
  }
) => {
  const testFunction = getTestFunction(
    parsedScenario.skippedViaTagFilter,
    options.only,
    options.skip,
    options.concurrent,
    options.framework
  );

  const fn = scenarioFromStepDefinitions.steps.reduce(
    (promiseChain, nextStep, index) => {
      const parsedStep = parsedScenario.steps[index];
      const stepArgument = parsedStep.stepArgument;
      const matches = matchSteps(
        parsedStep.stepText,
        scenarioFromStepDefinitions.steps[index].stepMatcher
      );
      let matchArgs: string[] = [];

      if (matches && (matches as RegExpMatchArray).length) {
        matchArgs = (matches as RegExpMatchArray).slice(1);
      }

      const args = [...matchArgs, stepArgument];

      return promiseChain.then(() => {
        return Promise.resolve()
          .then(() => nextStep.stepFunction(...args))
          .catch((error) => {
            error.message = `gherkin-testkit: ${parsedStep.stepText} (line ${parsedStep.lineNumber})\n\n${error.message}`;
            throw error;
          });
      });
    },
    Promise.resolve()
  );

  if (options.framework === 'mocha') {
    if (options.timeout) {
      testFunction(scenarioTitle, () => {
        return fn;
      }).timeout(options.timeout);
    } else {
      testFunction(scenarioTitle, () => {
        return fn;
      });
    }
  } else {
    testFunction(
      scenarioTitle,
      () => {
        return fn;
      },
      options.timeout
    );
  }
};

const createDefineScenarioFunction = (
  featureFromStepDefinitions: FeatureFromStepDefinitions,
  parsedFeature: ParsedFeature,
  options: {
    framework: string;
    only: boolean;
    skip: boolean;
    concurrent: boolean;
    timeout: number | undefined;
  }
) => {
  const defineScenarioFunction: DefineScenarioFunction = (
    scenarioTitle: string,
    stepsDefinitionFunctionCallback: StepsDefinitionCallbackFunction,
    timeout?: number
  ) => {
    if (timeout) {
      options.timeout = timeout;
    }

    const scenarioFromStepDefinitions: ScenarioFromStepDefinitions = {
      title: scenarioTitle,
      steps: []
    };

    featureFromStepDefinitions.scenarios.push(scenarioFromStepDefinitions);

    stepsDefinitionFunctionCallback({
      defineStep: createDefineStepFunction(scenarioFromStepDefinitions),
      given: createDefineStepFunction(scenarioFromStepDefinitions),
      when: createDefineStepFunction(scenarioFromStepDefinitions),
      then: createDefineStepFunction(scenarioFromStepDefinitions),
      and: createDefineStepFunction(scenarioFromStepDefinitions),
      but: createDefineStepFunction(scenarioFromStepDefinitions),
      pending: () => {
        // Nothing to do
      }
    });

    const parsedScenario = parsedFeature.scenarios.filter(
      (s) => s.title.toLowerCase() === scenarioTitle.toLowerCase()
    )[0];

    const parsedScenarioOutline = parsedFeature.scenarioOutlines.filter(
      (s) => s.title.toLowerCase() === scenarioTitle.toLowerCase()
    )[0];

    const featureOptions = parsedFeature.options;

    scenarioTitle = processScenarioTitleTemplate(
      scenarioTitle,
      parsedFeature,
      featureOptions,
      parsedScenario,
      parsedScenarioOutline
    );

    ensureFeatureFileAndStepDefinitionScenarioHaveSameSteps(
      featureOptions,
      parsedScenario || parsedScenarioOutline,
      scenarioFromStepDefinitions
    );

    if (checkForPendingSteps(scenarioFromStepDefinitions)) {
      test(scenarioTitle, () => {
        // Nothing to do
      });
    } else if (parsedScenario) {
      defineScenario(
        scenarioTitle,
        scenarioFromStepDefinitions,
        parsedScenario,
        options
      );
    } else if (parsedScenarioOutline) {
      parsedScenarioOutline.scenarios.forEach((scenario) => {
        defineScenario(
          scenario.title || scenarioTitle,
          scenarioFromStepDefinitions,
          scenario,
          options
        );
      });
    }
  };

  return defineScenarioFunction;
};

const createDefineScenarioFunctionWithAliases = (
  featureFromStepDefinitions: FeatureFromStepDefinitions,
  parsedFeature: ParsedFeature,
  framework: string,
  timeout: number | undefined
) => {
  const defineScenarioFunctionWithAliases = createDefineScenarioFunction(
    featureFromStepDefinitions,
    parsedFeature,
    {
      framework,
      only: false,
      skip: false,
      concurrent: false,
      timeout
    }
  );

  (defineScenarioFunctionWithAliases as DefineScenarioFunctionWithAliases).only = createDefineScenarioFunction(
    featureFromStepDefinitions,
    parsedFeature,
    {
      framework,
      only: true,
      skip: false,
      concurrent: false,
      timeout
    }
  );

  (defineScenarioFunctionWithAliases as DefineScenarioFunctionWithAliases).skip = createDefineScenarioFunction(
    featureFromStepDefinitions,
    parsedFeature,
    {
      framework,
      only: false,
      skip: true,
      concurrent: false,
      timeout
    }
  );

  (defineScenarioFunctionWithAliases as DefineScenarioFunctionWithAliases).concurrent = createDefineScenarioFunction(
    featureFromStepDefinitions,
    parsedFeature,
    {
      framework,
      only: false,
      skip: false,
      concurrent: true,
      timeout
    }
  );

  return defineScenarioFunctionWithAliases as DefineScenarioFunctionWithAliases;
};

const createDefineStepFunction = (
  scenarioFromStepDefinitions: ScenarioFromStepDefinitions
) => {
  return (stepMatcher: string | RegExp, stepFunction: () => any) => {
    const stepDefinition: StepFromStepDefinitions = {
      stepMatcher,
      stepFunction
    };

    scenarioFromStepDefinitions.steps.push(stepDefinition);
  };
};

export function defineFeature(
  featureFromFile: ParsedFeature,
  scenariosDefinitionCallback: ScenariosDefinitionCallbackFunction,
  framework: string = 'mocha',
  timeout: number | undefined = undefined
) {
  const featureFromDefinedSteps: FeatureFromStepDefinitions = {
    title: featureFromFile.title,
    scenarios: []
  };

  const parsedFeatureWithTagFiltersApplied = applyTagFilters(featureFromFile);

  if (
    parsedFeatureWithTagFiltersApplied.scenarios.length === 0 &&
    parsedFeatureWithTagFiltersApplied.scenarioOutlines.length === 0
  ) {
    return;
  }

  describe(featureFromFile.title, () => {
    scenariosDefinitionCallback(
      createDefineScenarioFunctionWithAliases(
        featureFromDefinedSteps,
        parsedFeatureWithTagFiltersApplied,
        framework,
        timeout
      )
    );

    checkThatFeatureFileAndStepDefinitionsHaveSameScenarios(
      parsedFeatureWithTagFiltersApplied,
      featureFromDefinedSteps
    );
  });
}
