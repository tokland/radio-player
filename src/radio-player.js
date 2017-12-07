import React, { Component, PureComponent } from 'react';
import {AsyncStorage} from 'react-native';
import {StyleSheet, View, Button, Text, ListView, FlatList, TextInput} from 'react-native';
import {Image, TouchableHighlight, TouchableOpacity, ScrollView, Switch} from 'react-native';
import _ from 'lodash';
import autoBind from 'react-auto-bind';
import ScrollableTabView, {DefaultTabBar} from 'react-native-scrollable-tab-view';
import Toast from 'react-native-simple-toast';

import StationsList from './stations-list';
import StatusBar from './status-bar';
import Header from './header';

const merge = (obj1, obj2) => _(obj2).isEmpty() ? obj1 : _.extend({}, obj1, obj2);
const defaultSourceStations = require('./stations-test.json');
const renderIf = (condition, viewfun) => condition ? viewfun() : null;

const renderTabBar = () => <DefaultTabBar tabStyle={{height: 50}} />;

const jsonUrl = "http://download.zaudera.com/public/radio-player"

const storage = {
  get: (key, defaultValue = null) =>
    AsyncStorage
      .getItem('@store:' + key)
      .then(value => value ? JSON.parse(value) : defaultValue)
      .catch(err => this.toast(`Cannot get store: ${key}`)),
  set: (key, value) =>
    AsyncStorage
      .setItem('@store:' + key, JSON.stringify(value))
      .catch(err => this.toast(`Cannot set store: ${key}=${value}`)),
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
      stationIsPlaying: false,
      search: null,
      status: null,
    };
    this.stopStatusTimerId = null;
  }

  getStations(sourceStations, favoriteStationsIds, usageCountByStationId) {
    const idsSet = new Set(favoriteStationsIds);
    return sourceStations.map(station => merge(station, {
      favorite: idsSet.has(station.id),
      logo_source: {uri: station.logo_url},
      usageCount: usageCountByStationId[station.id] || 0,
    }));
  }

  onPlayerStateChange({status}) {
    const {currentStation} = this.state;

    if (status === "STOPPED" || status === "ERROR") {
      if (!this.stopStatusTimerId) {
        this.stopStatusTimerId = _.delay(() => {
          if (currentStation)
            this.toast(`Error playing: ${currentStation.name}`)
          this.setState({stationIsPlaying: false});
        }, 5000);
      }
    } else if (this.stopStatusTimerId) {
      clearTimeout(this.stopStatusTimerId);
      this.stopStatusTimerId = null;
    }
    this.setState({status});
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
              const usageCountByStationId = _(this.state.stations)
                .map(st => [st.id, st.usageCount]).fromPairs().value();
              const stations = this.getStations(sourceStations, favoriteStationsIds, usageCountByStationId);
              this.setState({stations});
              storage.set("stations", {version: latestVersion, stations: sourceStations});
            });
        }
      })
      .catch(err => this.toast(`Error uploading stations: ${err}`));
  }

  componentDidMount() {
    this.playerSubscription = this.props.player.subscribeToState(this.onPlayerStateChange);

    Promise.all([
        storage.get("stations", {stations: null, version: -1}),
        storage.get("favorites", []),
        storage.get("usage", {}),
      ])
      .then(([versionedSourceStations, favoriteStationsIds, usageCountByStationId]) => {
        const {stations: sourceStations, version: stationsVersion} = versionedSourceStations;
        const stations = this.getStations(sourceStations || defaultSourceStations, favoriteStationsIds, usageCountByStationId);

        this.setState({
          loaded: true,
          stations,
          stationsVersion,
        });
        this.updateLatestStations();
      });
  }

  componentWillUnmount() {
    this.playerSubscription.unsubscribe();
  }

  onFavoritePress(stationToToggle) {
    const newStations = this.state.stations.map(station =>
      merge(station, {
        favorite: station.id == stationToToggle.id ? !station.favorite : station.favorite,
      })
    );
    const favoriteStationsIds = newStations.filter(station => station.favorite).map(station => station.id);
    storage.set('favorites', favoriteStationsIds);
    this.setState({stations: newStations});
  }

  incrementUsageCount(station) {
    const newStations = _(this.state.stations)
      .map(st => merge(st, {usageCount: st.usageCount + (st.id === station.id ? 1 : 0)}))
      .value();
    const newUsage = _(newStations).map(st => [st.id, st.usageCount]).fromPairs().value();
    storage.set('usage', newUsage);
    this.setState({stations: newStations});
  }

  toast(msg) {
    Toast.show(msg, Toast.SHORT);
  }

  play(station) {
    this.incrementUsageCount(station);
    this.props.player.play(station);
    this.setState({stationIsPlaying: true, currentStation: station});
  }

  playCurrentStation() {
    return this.play(this.state.currentStation);
  }

  stop() {
    this.props.player.stop();
    this.setState({stationIsPlaying: false});
  }

  onSearch(text: string) {
    this.setState({search: text});
  }

  render() {
    return this.state.loaded ? this._render() : null;
  }

  onSwipedOut() {
    this.props.player.stop();
    this.setState({stationIsPlaying: false, currentStation: null});
  }

  _render() {
    const {player} = this.props;
    const {currentStation, stations, favorites, search, status, stationIsPlaying} = this.state;
    const order = [["usageCount", "desc"], ["name", "asc"]];
    const allStations = _(stations).orderBy(..._.zip(...order)).value();
    const initialPage = _(this.state.stations.favorites).isEmpty() ? 0 : 1;
    const favoriteStations = allStations.filter(station => station.favorite);
    const isPlaying = stationIsPlaying; // player.isPlaying();

    const stationsListProps = {
      currentStation: currentStation,
      onPress: this.play,
      onFavoritePress: this.onFavoritePress,
      search: search,
      isPlaying: isPlaying,
    };

    const styles = {
      mainView: {flex: 1},
      tabViews: {marginTop: 0},
      tabView: {marginTop: 50},
    };

    return (
      <View style={styles.mainView}>
        { /* <Header onSearch={this.onSearch} /> */ }

        <ScrollableTabView
            style={styles.tabViews}
            tabBarTextStyle={{fontFamily: 'Roboto', fontSize: 16, marginTop: 5}}
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
          onSwipedOut={this.onSwipedOut}
        />
      </View>
    );
  }
}
