import React, { Component, PureComponent } from 'react';
import {AsyncStorage} from 'react-native';
import {StyleSheet, View, Button, Text, ListView, FlatList, TextInput} from 'react-native';
import {Image, TouchableHighlight, TouchableOpacity, ScrollView, Switch} from 'react-native';
import _ from 'lodash';
import autoBind from 'react-auto-bind';
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view';

import StationsList from './stations-list';
import StatusBar from './status-bar';
import Header from './header';

const merge = (obj1, obj2) => _(obj2).isEmpty() ? obj1 : _.extend({}, obj1, obj2);
const defaultSourceStations = require('./stations-test.json');
const renderIf = (condition, viewfun) => condition ? viewfun() : null;

const renderTabBar = () => <DefaultTabBar tabStyle={{height: 50}} />;
const styles = {
  mainView: {flex: 1, marginTop: 0},
  tabViews: {marginTop: 0},
  tabView: {marginTop: 50},
};

const jsonUrl = "http://download.zaudera.com/public/radio-player"

const storage = {
  get: (key) =>
    AsyncStorage.getItem('@store:' + key).then(value => value? JSON.parse(value) : null).catch(err => null),
  set: (key, value) =>
    AsyncStorage.setItem('@store:' + key, JSON.stringify(value)).catch(err => null),
};

export default class RadioPlayer extends PureComponent {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      loaded: false,
      stations: null,
      stationsVersion: 0,
      currentStation: null,
      search: null,
      status: null,
    };
  }

  getStations(sourceStations, favoriteStationsIds) {
    const idsSet = new Set(favoriteStationsIds);
    return sourceStations.map(station =>
        merge(station, {favorite: idsSet.has(station.id), logo_source: {uri: station.logo_url}}));
  }

  onPlayerStateChange({status, currentStation}) {
    this.setState({status, currentStation});
  }

  updateLatestStations() {
    return fetch(`${jsonUrl}/update-version.json`)
      .then(res => res.json())
      .then(version => version.current)
      .then(latestVersion => {
        if (this.state.stationsVersion < latestVersion) {
          return fetch(`${jsonUrl}/update-stations-${latestVersion}.json`)
            .then(res => res.json())
            .then(sourceStations => {
              const favoriteStationsIds = (this.state.stations || [])
                .filter(station => station.favorite).map(station => station.id);
              const stations = this.getStations(sourceStations, favoriteStationsIds);
              this.setState({stations});
              storage.set("stations", {version: latestVersion, stations: sourceStations});
            })
            .catch(err => {});
        }
    });
  }

  componentDidMount() {
    this.playerSubscription = this.props.player.subscribeToState(this.onPlayerStateChange);

    Promise.all([storage.get("stations"), storage.get("favorites")]).then(([versionedSourceStations, favoriteStationsIds]) => {
      const {stations: sourceStations = [], version: stationsVersion = 0} = versionedSourceStations || {};
      const stations = this.getStations(sourceStations || defaultSourceStations, favoriteStationsIds);
      this.setState({loaded: true, stations, stationsVersion});
      this.updateLatestStations();
    });
  }

  componentWillUnmount() {
    this.playerSubscription.unsubscribe();
  }

  onFavoritePress(stationToToggle) {
    const newStations = this.state.stations
      .map(station => merge(station, {favorite: station.id == stationToToggle.id ? !station.favorite : station.favorite}));
    const favoriteStationsIds = newStations.filter(station => station.favorite).map(station => station.id);
    storage.set('favorites', favoriteStationsIds);
    this.setState({stations: newStations});
  }

  play(station) {
    this.props.player.play(station);
  }

  playCurrentStation() {
    this.props.player.play(this.state.currentStation);
  }

  stop() {
    this.props.player.stop();
  }

  onSearch(text) {
    this.setState({search: text});
  }

  render() {
    if (this.state.loaded) {
      return this._render();
    } else {
      return null;
    }
  }

  _render() {
    const {player} = this.props;
    const {currentStation, stations, favorites, search, status} = this.state;
    const allStations = stations || [];
    const initialPage = _(this.state.stations.favorites).isEmpty() ? 0 : 1;
    const favoriteStations = allStations.filter(station => station.favorite);
    const isPlaying = player.isPlaying();

    const stationsListProps = {
      currentStation: currentStation,
      onPress: this.play,
      onFavoritePress: this.onFavoritePress,
      search: search,
    };

    return (
      <View style={styles.mainView}>
        { /* <Header onSearch={this.onSearch} /> */ }

        <ScrollableTabView
            style={styles.tabViews}
            initialPage={initialPage}
            renderTabBar={renderTabBar}
            tabBarPosition="overlayTop"
        >
          <ScrollView tabLabel="ALL" style={styles.tabView}>
            <StationsList stations={allStations} {...stationsListProps} />
          </ScrollView>

          <ScrollView tabLabel="FAVORITES" style={styles.tabView}>
            <StationsList stations={favoriteStations} {...stationsListProps} />
          </ScrollView>
        </ScrollableTabView>

        <StatusBar
          station={currentStation}
          isPlaying={isPlaying}
          status={status}
          onPress={isPlaying ? this.stop : this.playCurrentStation}
        />
      </View>
    );
  }
}
