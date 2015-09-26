require('babel/polyfill');

import express from 'express';
import { Server as http } from 'http';

import LocationData from './google';
import ForcastData from './forcastio';
import {attach_location_logs, attach_forcast_logs} from './log';
import {process_forcast} from './manager';

export default function gtf({
  token,
  interval,
  locations,
  units = 'us',
  silent = false
}){
  if (!token) throw new Error('Must provide a `token`.');
  if (!locations) throw new Error('Must provide `locations`.');

  locations = locations.split(',');

  let app = express();
  let srv = http(app);
  let assets = __dirname + '/assets';

  let weather = {};
  let processed = {};

  let location_details = new LocationData({locations})

  attach_location_logs(location_details, silent);

  location_details.on('data', () => {
    // look through all locations and set watcher on forcast details that update our location
    // weather data
    for (let location of location_details.data){
      let forcast_details = new ForcastData({token, interval, location, units})
      attach_forcast_logs(forcast_details, silent);
      // can be called multiple tiles over the interval to update our weather
      forcast_details.on('data', () => {
        weather[location.id] = forcast_details.data
        processed[location.id] = process_forcast(forcast_details.data)
      })
      forcast_details.fetch();
    }
  });

  // app.use((req, res, next) => {
  //   if (forcast_details.ready) return next();
  //   forcast_details.once('ready', next);
  // });

  app.get('/', (req, res) => {
    res.type('txt');
    res.send('Check if it\'s safe to go fly your quad on a particular day');
  });

  // static files
  app.use('/assets', express.static(assets));

  app.get('/weather.json', (req, res) => {
    return res
      .status(200)
      // .json({weathers: weather, ratings: processed});
      .json({ratings: processed});
  });

  app.get('/is-it-good.json', (req, res) => {
    return res
      .status(200)
      .json({good: 'maybe'});
  });

  // set things in motion
  location_details.fetch_locations();

  return srv;
}
