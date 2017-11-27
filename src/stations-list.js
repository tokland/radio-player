import React from 'react';
import {FlatList, View, VirtualizedList} from 'react-native';
import _ from 'lodash';
import Diacritics from 'diacritic';

import StationItem from './station-item';

const removeCase = (s) => Diacritics.clean(s).toLowerCase();
const keyExtractor = station => station.id;

// TODO: StationsList: show spinner when loading
export default StationsList = ({stations, currentStation, search, onPress, onFavoritePress}) => {
  const renderStation = ({item: station}) => (
    <StationItem
      station={station}
      onPress={onPress}
      isPlaying={currentStation && currentStation.id === station.id}
      onFavoritePress={onFavoritePress}
    />
  );

  const cleanSearch = search ? removeCase(search) : null;
  const stationsWithSearch = cleanSearch ?
    stations.filter(station => _(removeCase(station.name)).includes(cleanSearch)) : stations;

  return (
    <VirtualizedList
      data={stationsWithSearch}
      renderItem={renderStation}
      getItemCount={items => items.length}
      getItem={(items, index) => items[index]}
      keyExtractor={keyExtractor}
      getItemLayout={(data, index) => ({length: 80, offset: 80 * index, index})}
      initialNumToRender={6}
      maxToRenderPerBatch={1}
      windowSize={1}
    />
  );
};