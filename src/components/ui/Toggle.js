import React, { useState } from 'react';
import styled from 'styled-components';

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
`;

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: ${(props) => props.width || '44px'};
  height: ${(props) => props.height || '16px'};
  margin-right: 8px;
  cursor: ${(props) => props.cursor || 'pointer'};
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
  background-color: ${(props) => props.backgroundColor || '#720000'};
  transition: ${(props) => props.transition || '0.4s'};
  border-radius: ${(props) => props.borderRadius || '16px'};

  &:before {
    position: absolute;
    content: "";
    height: ${(props) => props.thumbSize || '12px'};
    width: ${(props) => props.thumbSize || '12px'};
    left: 2px;
    bottom: 2px;
    background-color: ${(props) => props.thumbColor || 'white'};
    transition: 0.4s;
    border-radius: 50%;
  }

  ${ToggleInput}:checked + & {
    background-color: ${(props) => props.checkedBackgroundColor || 'white'};
  }

  ${ToggleInput}:checked + &:before {
    transform: translateX(${(props) => props.thumbTranslate || '14px'});
    background-color: ${(props) => props.checkedThumbColor || '#720000'};
  }
`;

const StatusText = styled.span`
  color: ${(props) => props.color || props.theme.primaryColor};
  font-size: ${(props) => props.fontSize || '0.9rem'};
`;

const Toggle = ({
  initialValue = false,
  onToggle,
  sliderProps = {},
  labelProps = {},
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
      <ToggleLabel {...labelProps}>
        <ToggleInput
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
        />
        <ToggleSlider {...sliderProps} />
      </ToggleLabel>
      <StatusText>{text}</StatusText>
    </ToggleWrapper>
  );
};

export default Toggle;
