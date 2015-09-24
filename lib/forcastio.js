import request from 'superagent';
import { EventEmitter } from 'events'

export default class ForcastData extends EventEmitter {
  constructor({ token, interval, location }) {
    super();
    this.token = token;
    this.interval = interval;
    this.location = location;
    this.data = {};
  }

  fetch() {
    let {geo} = this.location;
    request
      .get(`https://api.forecast.io/forecast/${this.token}/${geo.lat},${geo.lng}`)
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
