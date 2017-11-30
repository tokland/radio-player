import React from 'react';
import {View, Text, Image} from 'react-native';
import {TouchableHighlight} from 'react-native';

const styles = {
  main: {},
  inner: isPlaying => ({flexDirection: "row", height: 80, backgroundColor: isPlaying ? "#DDD" : "#FFF"}),
  logo: {width: 60, height: 60, margin: 10, justifyContent: 'center'},
  name: {flex: 1, padding: 5, fontSize: 16, color: "#000", lineHeight: 40, fontWeight: "bold", justifyContent: 'center'},
  favorite: {width: 32, height: 32, marginTop: 16, marginRight: 10, marginLeft: 10},
};

const images = {
  star_select: require("../images/star-select.png"),
  star_unselect: require("../images/star-unselect.png"),
};

export default StationItem = ({station, isPlaying, onPress, onFavoritePress}) =>
  <TouchableHighlight onPress={() => onPress(station)}>
    <View style={styles.inner(isPlaying)}>
      <Image source={station.logo_source} style={styles.logo} />

      <Text style={styles.name}>
        {station.name}
      </Text>

      <TouchableHighlight onPress={() => onFavoritePress(station)}>
        <Image source={station.favorite ? images.star_select : images.star_unselect} style={styles.favorite} />
      </TouchableHighlight>
    </View>
  </TouchableHighlight>
