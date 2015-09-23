require('babel/polyfill');

import express from 'express';
import { Server as http } from 'http';

import LocationData from './google';
import ForcastData from './forcastio';
import log from './log';

export default function gtf({
  token,
  interval,
  locations,
  silent = false
}){
  console.log(token, interval, locations, silent);
  if (!token) throw new Error('Must provide a `token`.');
  if (!locations) throw new Error('Must provide `locations`.');

  locations = locations.split(',');

  let app = express();
  let srv = http(app);
  let assets = __dirname + '/assets';

  let location_details = new LocationData({locations})
  let forcast_details = new ForcastData({token, interval, location_details})

  // start logging
  log(forcast_details, location_details, silent);

  app.use((req, res, next) => {
    if (forcast_details.ready) return next();
    forcast_details.once('ready', next);
  });

  app.get('/', (req, res) => {
    res.type('txt');
    res.send('Check if it\'s safe to go fly your quad on a particular day');
  });

  // static files
  app.use('/assets', express.static(assets));

  app.get('/is-it-good.json', (req, res) => {
    return res
      .status(200)
      .json({good: true})
  });

  return srv;
}
