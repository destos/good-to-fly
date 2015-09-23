import async from 'async'
import request from 'superagent';
import { EventEmitter } from 'events'

export default class LocationData extends EventEmitter {
  constructor({ interval, locations }) {
    super();
    // retry interval
    this.retry = {
      interval: interval || 5000,
      times: 3
    }
    this.lookup_locations = locations;
    this.location_data = [];
    this.fetch_locations.bind(this);
  }

  fetch_locations() {
    // async.parallel()
    async.map(this.lookup_locations, this.fetch_location.bind(this), (err, locations) => {
      if (err) return;
      this.location_data = locations;
      this.emit('data', locations);
    });
  }

  fetch_location(location, callback) {
    return async.retry(this.retry, (retry_callback, results) => {
      request
        .get(`http://maps.googleapis.com/maps/api/geocode/json?address=${location}&sensor=false`)
        .end((err, res) => {
          retry_callback(err, res)
        })
        this.emit('fetch', location);
    }, (err, res) => {
      if (err) {
        this.emit('error', err);
        return callback(err, null)
      }
      // send location data long it's way
      callback(null, res.body)
    });
  }
}
