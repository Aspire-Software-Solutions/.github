import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Router, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Auth/Login.js';
import Home from '/Users/miafelipe/Desktop/coding/RIVAL/src/pages/Home.js';


describe('Login Component', () => {
  test('logs in with email and password and navigates to Home', async () => {
    render(
      <Router>
        <Login/>
          <Route path="/home" element={<Home />} />
      </Router>
    );

    expect(screen.getByText(/Home/i)).toBeInTheDocument();

    // Simulate user entering email and password
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Simulate form submission
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for navigation to Home page
    });
  });

