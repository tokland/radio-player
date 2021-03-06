import {DeviceEventEmitter, AppState} from 'react-native';
import _ from 'lodash';
import autoBind from 'react-auto-bind';
import PushNotification from 'react-native-push-notification';
import RNAudioStreamer from 'react-native-audio-streamer';
import Rx from 'rxjs/Rx';

// TODO. Extract: NotificationBar

export default class Player {
  static actions = [
    {key: "play", name: "PLAY", icon: "action_play", autoCancel: false},
    {key: "stop", name: "STOP", icon: "action_stop", autoCancel: false},
    {key: "close", name: "CLOSE", icon: "action_close", autoCancel: true},
  ];

  constructor() {
    autoBind(this);
    this.actions = this.constructor.actions;
    this.actionsByKey = _.keyBy(this.constructor.actions, "key");
    this.state = {
      appState: null,
      status: null,
      // TODO: No reference to stations here
      currentStation: null,
      isPlaying: false,
    };
    this.setup();
    this.stream = new Rx.BehaviorSubject("PAUSED");
    this.canNotificationBeVisible = true;
  }

  setup() {
    /* Audio streaming */
    this.subscription = DeviceEventEmitter
      .addListener('RNAudioStreamerStatusChanged', this.statusChanged);

    /* Push notification */
    PushNotification.configure({});
    PushNotification.registerNotificationActions(this.actions);
    DeviceEventEmitter.addListener('notificationActionReceived', this.onNotificationAction);

    /* App state */
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  isPlaying() {
    //return _(["PLAYING", "BUFFERING", "PREBUFFERING"]).includes(this.state.status);
    return this.state.isPlaying;
  }

  subscribeToState(fn) {
    RNAudioStreamer.status((err, status) => {
      this.setState({status: err ? `ERROR: ${err.toString()}` : status});
    });
    return this.stream.subscribe(fn);
  }

  setState(newState) {
    const oldState = _.clone(this.state)
    _.extend(this.state, newState);
    const streamState = _.pick(this.state, ["status"]);
    this.stream.next(streamState);

    if (this.state.appState === "active") {
      this.closeNotification();
      this.canNotificationBeVisible = true;
    } else if (oldState.appState === "active" && this.state.appState === "background") {
        if (this.isPlaying()) {
          this.renderNotification();
        }
    } else {
      this.renderNotification();
    }
  }

  handleAppStateChange(appState) {
    // appState : "active" | "background"
    this.setState({appState});
  }

  // TODO: Notifications out (as props)
  renderNotification() {
    if (!this.canNotificationBeVisible) return;

    const {status, currentStation} = this.state;
    const isPlaying = this.isPlaying();

    const {actions, sweepable} = do {
      if (isPlaying) {
        ({actions: ["stop", "close"], sweepable: false});
      } else if (!isPlaying && currentStation) {
        ({actions: ["play", "close"], sweepable: true});
      } else {
        ({actions: ["close"], sweepable: true});
      }
    };

    const notificationActions = _(this.actionsByKey).at(actions).value();

    PushNotification.localNotification({
      id: "425133149",
      title: currentStation && status ? `${currentStation.name}` : "Radio Player",
      message: currentStation ? status : "",
      playSound: false,
      vibrate: false,
      actions: JSON.stringify(notificationActions),
      ongoing: !sweepable,
      autoCancel: false,
    });
    //this.canNotificationBeVisible = true;
  }

  closeNotification() {
    //if (!this.canNotificationBeVisible) return;
    PushNotification.cancelAllLocalNotifications();
    //this.canNotificationBeVisible = false;
  }
  
  onNotificationAction(action) {
    const {currentStation} = this.state;
    const actionKey = JSON.parse(action.dataJSON).action;

    switch (actionKey) {
      case "play":
        this.play(currentStation);
        break;
      case "stop":
        this.stop();
        break;
      case "close":
        this.canNotificationBeVisible = false;
        this.stop();
        break;
      default:
        throw "Unknown notification action: " + actionKey;
    }
  }
  
  statusChanged(status) {
    // status: "PLAYING" | "PAUSED" | "STOPPED" | "FINISHED" | "BUFFERING" | "ERROR"
    this.setState({status});
  }
  
  play(station) {
    if (this.isPlaying() &&
        this.state.currentStation &&
        this.state.currentStation.stream_url == station.stream_url) {
      return;
    } else {
      this.setState({
        isPlaying: true,
        currentStation: station,
      });
      if (station.start_position) {
        RNAudioStreamer.setUrlWithOffset(station.stream_url, station.start_position);
      } else {
        RNAudioStreamer.setUrl(station.stream_url);
      }
      RNAudioStreamer.play();
    }
  }
  
  stop() {
    this.setState({status: "PAUSING", isPlaying: false});
    RNAudioStreamer.pause();
  }
}
