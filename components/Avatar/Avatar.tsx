import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  uri?: string;
  size?: number;
  initials?: string;
}

const Avatar: React.FC<Props> = ({ uri, size = 48, initials }) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.initials}>{initials || 'NN'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#333', fontWeight: '700' },
});

export default Avatar;
