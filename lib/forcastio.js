import request from 'superagent';
import { EventEmitter } from 'events'

export default class ForcastData extends EventEmitter {
  constructor({ token, interval, location_details}) {
    super();
    this.token = token;
    this.interval = interval;
    this.ready = false;
    this.location_details = location_details
    this.location_details.fetch_locations();
    this.location_details.on('data', this.fetch.bind(this));
  }

  fetch() {
    // debugger;
    console.log(this.location_details.location_data);
    this.ready = true;
    // request.get(`https://`)
  }
}
