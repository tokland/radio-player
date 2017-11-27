import React from 'react';
import {View, Text, Image} from 'react-native';
import {TouchableHighlight} from 'react-native';


const styles = {
  main: {flexDirection: "row", height: 70, backgroundColor: '#222'},
  logo: {width: 50, height: 60, margin: 5, justifyContent: 'center'},
  name: {flex: 1, padding: 5, fontSize: 16, lineHeight: 40, textAlign: 'center',
         justifyContent: 'center', color: '#fff'},
  buttons: {width: 50, height: 70, marginRight: 5, justifyContent: 'center'},
};

const images = {
  stop: require("../images/stop.png"),
  play: require("../images/play.png"),
};

export default StatusBar = ({station, status, isPlaying, onPress}) =>
    station ?
      <View style={styles.main}>
        <Image source={station.logo_source} style={styles.logo} />
        <Text style={styles.name}>
          {station.name}
        </Text>

        <TouchableHighlight onPress={onPress}>
          <Image source={isPlaying ? images.stop : images.play} style={styles.buttons} />
        </TouchableHighlight>
      </View> : null;
