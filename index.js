import React from 'react';
import {AppRegistry} from 'react-native';

import Player from './src/player'
import RadioPlayer from './src/radio-player'

const player = new Player();
const RadioPlayerComponent = () => (<RadioPlayer player={player} />);
AppRegistry.registerComponent('RadioPlayer', () => RadioPlayerComponent);
