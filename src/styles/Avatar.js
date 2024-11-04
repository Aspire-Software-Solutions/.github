import React from 'react';
import styled from "styled-components";

const AvatarWrapper = styled.div`
  position: relative;
  display: inline-block;
  height: ${(props) => (props.lg ? "130px" : "40px")};
  width: ${(props) => (props.lg ? "130px" : "40px")};
  margin-right: 1rem;
  margin-bottom: 1rem;

  @media screen and (max-width: 530px) {
    height: ${(props) => (props.lg ? "110px" : "40px")};
    width: ${(props) => (props.lg ? "110px" : "40px")};
  }
`;

const StyledImage = styled.img`
  height: 100%;
  width: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const StatusDot = styled.span`
  position: absolute;
  bottom: 10%;
  right: 10%;
  width: ${(props) => (props.lg ? "16px" : "12px")};
  height: ${(props) => (props.lg ? "16px" : "12px")};
  border-radius: 50%;
  background-color: ${(props) => props.isActive ? "#2ecc71" : "#95a5a6"};
  border: 2px solid white;
  transition: background-color 0.3s ease;
  display: ${(props) => (props.showStatus ? "block" : "none")};
`;

const Avatar = ({ 
  src, 
  alt = "avatar", 
  lg = false, 
  showStatus = false, 
  isActive = false,
  ...props 
}) => {
  return (
    <AvatarWrapper lg={lg}>
      <StyledImage src={src} alt={alt} {...props} />
      <StatusDot 
        lg={lg} 
        showStatus={showStatus} 
        isActive={isActive} 
      />
    </AvatarWrapper>
  );
};

export default Avatar;