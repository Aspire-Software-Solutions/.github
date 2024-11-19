import React, { useState } from 'react';
import styled from 'styled-components';

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;// Removed cursor: pointer from here
`;

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;  
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #720000;
  transition: 0.4s;
  border-radius: 16px;

  &:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  ${ToggleInput}:checked + & {
    background-color: white;
  }

  ${ToggleInput}:checked + &:before {
    transform: translateX(14px);
    background-color: #720000;
  }
`;

const StatusText = styled.span`
  color: ${props => props.theme.primaryColor};
  font-size: 0.9rem;
`;

const Toggle = ({
    initialValue = false,
    onToggle,
    sliderProps = {},
    text = "Show Status",
  }) => {
  const [isEnabled, setIsEnabled] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    onToggle(newValue);
  };

  return (
    <ToggleWrapper>
      <ToggleLabel>
        <ToggleInput
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
        />
        <ToggleSlider {...sliderProps} />
      </ToggleLabel>
      <StatusText>{ text }</StatusText>
    </ToggleWrapper>
  );
};

export default Toggle;