import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

type Variant = 'h1' | 'h2' | 'body' | 'caption';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  children: string;
}

const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  body: { fontSize: 16 },
  caption: { fontSize: 12, color: '#666' },
});

const Text: React.FC<Props> = ({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}) => {
  return (
    <RNText
      style={[styles[variant], color ? { color } : null, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export default Text;
