import React from 'react';

declare global {
  const If: React.FC<{
    condition: boolean;
    children?: React.ReactNode;
  }>;

  const When: React.FC<{
    condition: boolean;
    children?: React.ReactNode;
  }>;

  const Otherwise: React.FC<{
    children?: React.ReactNode;
  }>;

  const Choose: React.FC<{
    children?: React.ReactNode;
  }>;
}

export {};
