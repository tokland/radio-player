import React from 'react';
import {View, Text, Image} from 'react-native';
import {TouchableHighlight} from 'react-native';

const styles = {
  inner: ({isPlaying, isCurrentStation}) => ({
    flexDirection: "row",
    height: 80,
    backgroundColor: isCurrentStation ? (isPlaying ? "#D0D5D0": "#EEE") : "#FFF",
  }),
  logo: {
    width: 60,
    height: 60,
    margin: 10,
    justifyContent: 'center',
  },
  nameWrapper: {
    flex: 1,
    padding: 5,
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    lineHeight: 40,
    color: "#000",
    fontWeight: "bold",
    paddingRight: 20,
    flexDirection: 'column'
  },
  usageCount: {
    flex: 1,
    flexDirection: 'column',
  },
  favorite: {
    width: 32,
    height: 32,
    marginTop: 16,
    marginRight: 10,
    marginLeft: 10,
  },
};

const images = {
  star_select: require("../images/star-select.png"),
  star_unselect: require("../images/star-unselect.png"),
};

export default StationItem = ({station, isPlaying, isCurrentStation, onPress, onFavoritePress}) =>
  <TouchableHighlight onPress={() => onPress(station)}>
    <View style={styles.inner({isPlaying, isCurrentStation})}>
      <Image source={station.logo_source} style={styles.logo} />

      <View style={styles.nameWrapper}>
        <Text style={styles.name}>
          {station.name}{__DEV__ ? ` (${station.usageCount})` : ""}
        </Text>
      </View>

      <TouchableHighlight onPress={() => onFavoritePress(station)}>
        <Image source={station.favorite ? images.star_select : images.star_unselect} style={styles.favorite} />
      </TouchableHighlight>
    </View>
  </TouchableHighlight>
