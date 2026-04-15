import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title?: string;
  children?: React.ReactNode;
}

const Card: React.FC<Props> = ({ title, children }) => {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  body: {},
});

export default Card;
