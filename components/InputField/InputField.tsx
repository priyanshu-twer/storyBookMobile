import React from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Text,
} from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  // icon?: React.ReactNode;
}

const InputField: React.FC<Props> = ({
  label,
  error,
  // icon,
  style,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput style={[styles.input, style]} {...rest} />
        {/* {icon ? <View style={styles.icon}>{icon}</View> : null} */}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { marginBottom: 4, fontSize: 14, color: '#333' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    fontSize: 16,
  },
  icon: { marginLeft: 8 },
  error: { marginTop: 4, color: 'red', fontSize: 12 },
});

export default InputField;
