import React, { createContext, useState, useContext } from "react";

const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  return (
    <StatusContext.Provider value={{ showActiveStatus, setShowActiveStatus }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => useContext(StatusContext);
