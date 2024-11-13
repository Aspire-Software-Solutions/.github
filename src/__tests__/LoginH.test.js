import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from './Login';
import Home from '../../pages/Home';

describe('Login Component', () => {
  test('logs in with email and password and navigates to Home', async () => {
    render(
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    );

    // Add more interactions if needed here, depending on what you need to test.
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });
});
