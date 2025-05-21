"use client";

import React, { createContext, useContext, useState } from "react";

interface YearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentYear, setCurrentYear] = useState("576");

  return (
    <YearContext.Provider value={{ currentYear, setCurrentYear }}>
      {children}
    </YearContext.Provider>
  );
};

export const useYearContext = () => {
  const context = useContext(YearContext);
  if (!context) {
    throw new Error("useYearContext must be used within a YearProvider");
  }
  return context;
};
