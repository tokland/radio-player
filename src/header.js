import React from 'react';
import {View, TextInput} from 'react-native';

const styles = {
  main: {backgroundColor: '#C1C1C1', padding: 0, marginBottom: 0},
  textInput: {backgroundColor: '#FFFFFF', paddingHorizontal: 8, borderRadius: 2, fontSize: 16},
};

export default Header = ({onSearch}) => (
  <View style={styles.main}>
    <TextInput style={styles.textInput} placeholder="Search..." onChangeText={onSearch} />
  </View>
);
