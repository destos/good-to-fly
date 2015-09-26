import request from 'superagent';
import { EventEmitter } from 'events'

export default class ForcastData extends EventEmitter {
  constructor({ token, interval, location, units }) {
    super();
    this.token = token;
    this.interval = interval;
    this.location = location;
    this.units = units;
    this.data = {};
  }

  fetch() {
    let {geo} = this.location;
    let language = 'en'
    let exclude = 'minutely,flags'
    request
      .get(`https://api.forecast.io/forecast/${this.token}/${geo.lat},${geo.lng}`)
      .query({units: this.units, language, exclude})
      .end(this.onres.bind(this));
    this.emit('fetch');
  }

  retry(){
    let interval = this.interval;
    setTimeout(this.fetch.bind(this), this.interval);
    this.emit('retry');
  }

  onres(err, res){
    if (err) {
      this.emit('error', err);
      return this.retry();
    }
    this.data = res.body;
    setTimeout(this.fetch.bind(this), this.interval);
    this.emit('data');
  }
}
