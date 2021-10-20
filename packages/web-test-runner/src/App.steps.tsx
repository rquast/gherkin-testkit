import {
  parseFeature,
  defineFeature,
  getGherkinTestKitConfiguration
} from '@gherkin-testkit/core';
import { expect } from 'chai';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

//@ts-ignore
import { plainText as AppFeature } from '@virtual:plain-text/src/App.feature';
import App from './App';

const feature = parseFeature(
  AppFeature,
  getGherkinTestKitConfiguration({})
);

defineFeature(feature, (test: any) => {
  test('Scenario: Incrementing the counter in the App component', async ({
    given,
    when,
    then
  }: {
    given: any;
    when: any;
    then: any;
  }) => {
    given('I have loaded the App component', () => {
      render(<React.StrictMode><App /></React.StrictMode>);
    });

    when('I click the incremenet button', () => {
      const countButton = screen.getByTestId('count-button');
      fireEvent.click(countButton);
    });

    then('I should see a count equal to 1', async () => {
      const incrementedButton = screen.getByText(/count is: 1/i);
      expect(document.body.contains(incrementedButton));
    });
  });
});
