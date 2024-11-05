import React, { useState, useRef, useEffect } from 'react';
import MentionDropdown from './MentionDropdown';

const TextInputWithMentions = ({ onChange, value, context, postId, placeholder }) => {
  const [text, setText] = useState(value || '');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Synchronize internal text state with value prop
  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(newText);
    setCursorPosition(cursorPos);
    onChange && onChange(e); // Pass the event object to onChange

    // Detect "@" mentions
    const textBeforeCursor = newText.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([\w\s]*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowDropdown(true);
    } else {
      setMentionQuery('');
      setShowDropdown(false);
    }
  };

  const insertMention = (handle) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const textAfterCursor = text.slice(cursorPosition);

    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const newText =
      textBeforeCursor.slice(0, mentionStart) +
      `@${handle} ` +
      textAfterCursor;

    const newCursorPosition = mentionStart + handle.length + 2; // +2 for '@' and space

    setText(newText);
    setCursorPosition(newCursorPosition);
    setShowDropdown(false);
    setMentionQuery('');

    // Create a synthetic event object to pass to onChange
    const syntheticEvent = {
      target: {
        value: newText,
      },
    };
    onChange && onChange(syntheticEvent);

    // Set focus back to textarea and update cursor position
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = newCursorPosition;
      textareaRef.current.selectionEnd = newCursorPosition;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={placeholder || 'Type your message...'}
        style={{ width: '100%', minHeight: '100px' }}
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: textareaRef.current
              ? textareaRef.current.offsetHeight
              : '100%',
            left: 0,
            zIndex: 1000,
          }}
        >
          <MentionDropdown
            queryText={mentionQuery}
            context={context}
            postId={postId}
            insertMention={insertMention}
          />
        </div>
      )}
    </div>
  );
};

export default TextInputWithMentions;
