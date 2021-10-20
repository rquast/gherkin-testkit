import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const countButton = screen.getByTestId('count-button');
    fireEvent.click(countButton);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
    expect(document.body.contains(linkElement));
  });
});
