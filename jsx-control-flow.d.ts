import React from 'react';

declare global {
  const If: React.FC<{
    condition: boolean;
    children?: React.ReactNode | (() => React.ReactNode);
  }>;

  const Else: React.FC<{
    children?: React.ReactNode | (() => React.ReactNode);
  }>;

  const When: React.FC<{
    condition: boolean;
    children?: React.ReactNode | (() => React.ReactNode);
  }>;

  const Otherwise: React.FC<{
    children?: React.ReactNode | (() => React.ReactNode);
  }>;

  const Choose: React.FC<{
    children?: React.ReactNode;
  }>;

  const For: <T>(props: {
    each?: string;
    of: Iterable<T> | T[];
    index?: string;
    children?: React.ReactNode;
  }) => React.ReactElement | null;

  const With: React.FC<{
    [key: string]: any;
    children?: React.ReactNode;
  }>;
}

export {};
