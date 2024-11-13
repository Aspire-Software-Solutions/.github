// Login.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';
import Login from './Login';
import ForgotPass from './ForgotPass';

describe('Login Component', () => {
  test('renders login form with expected elements', () => {
    render(
      <Router>
        <Login changeToForgotPass={() => {}} />
      </Router>
    );

    expect(screen.getByText(/Log In/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });



  test('navigates to ForgotPassword component and interacts with it', () => {
    // Mock a function to handle the "Forgot Password" link click
    const changeToForgotPass = jest.fn();

    render(
      <Router>
        <Login changeToForgotPass={changeToForgotPass} />
      </Router>
    );

    // Simulate clicking "Forgot Password" link
    fireEvent.click(screen.getByText(/Forgot Password/i));
    expect(changeToForgotPass).toHaveBeenCalledTimes(1);

    // Render ForgotPassword component directly to test interactions
    render(
      <Router>
        <ForgotPass/>
      </Router>
    );

    // Check if the ForgotPassword component has an email input and submit button
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const resetButton = screen.getByRole('button', { name: /Reset Password/i });

    expect(emailInput).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();

    // Simulate entering an email and clicking reset button
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');

    fireEvent.click(resetButton);
    // Add any expectations here for actions that happen after clicking the reset button,
    // like checking if a success message appears or a function is called.
  });

  test('navigates to ForgotPass component and allows email input', () => {
    // Mock function to handle "Forgot Password" link click
    const changeToForgotPass = jest.fn();

    render(
      <Router>
        <Login changeToForgotPass={changeToForgotPass} />
      </Router>
    );

    // Simulate clicking "Forgot Password" link
    fireEvent.click(screen.getByText(/Forgot Password/i));
    expect(changeToForgotPass).toHaveBeenCalledTimes(1);

    // Render ForgotPass component directly
    render(
      <Router>
        <ForgotPass />
      </Router>
    );

    // Find the email input in ForgotPass and test email entry
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);

    expect(emailInput).toBeInTheDocument();

    // Simulate entering an email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

    // test('shows toast notification if no email is entered in ForgotPass', () => {
    //   render(
    //     <Router>
    //       <ForgotPass />
    //     </Router>
    //   );

    //   const resetButton = screen.getByRole('button', { name: /Reset Password/i });

    //   // Simulate clicking reset without entering an email
    //   fireEvent.click(resetButton);

    //   // Check if the toast notification is triggered
    //   expect(toast).toHaveBeenCalledWith(expect.stringContaining('Please enter your email'));
    // });
});
