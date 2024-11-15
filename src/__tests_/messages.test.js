// TextInputWithMentions.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TextInputWithMentions from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Mentions/TextInputWithMentions.js';

describe('TextInputWithMentions Component', () => {
  test('renders without crashing', () => {
    render(<TextInputWithMentions />);
  });

  test('displays the provided value', () => {
    const value = 'Hello, world!';
    render(<TextInputWithMentions value={value} />);
  });

  test('calls onChange when text is updated', () => {
    const handleChange = jest.fn();
    render(<TextInputWithMentions onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('shows mention dropdown when typing "@"', () => {
    render(<TextInputWithMentions />);
    const textarea = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(textarea, { target: { value: 'Hello @' } });
    expect(screen.getByText(/@mention/)).toBeInTheDocument(); // Assuming MentionDropdown displays a list starting with @mention
  });

  test('inserts mention into text area', () => {
    const handleChange = jest.fn();
    render(<TextInputWithMentions onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(textarea, { target: { value: 'Hello @' } });
    const mentionOption = screen.getByText('@mention'); // Replace with actual mention name
    
    fireEvent.click(mentionOption);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'Hello @mention ',
        }),
      })
    );
  });
});
