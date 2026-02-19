import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

interface Props {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Accordion: React.FC<Props> = ({
  title,
  children,
  initiallyOpen = false,
}) => {
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggle}
        style={styles.header}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.indicator}>{open ? '-' : '+'}</Text>
      </TouchableOpacity>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  title: { fontSize: 16, fontWeight: '600' },
  indicator: { fontSize: 18, fontWeight: '600' },
  content: { padding: 12, backgroundColor: '#fff' },
});

export default Accordion;
