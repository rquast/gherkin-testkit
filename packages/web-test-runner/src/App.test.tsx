import React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
import App from './App';

describe('A simple test', () => {
  it('renders the App component', async () => {
    const { getByText } = render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    const linkElement = getByText(/Learn React/i);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
    // debugger;
    expect(document.body.contains(linkElement));
  });
});
