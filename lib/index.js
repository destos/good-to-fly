require('babel/polyfill');
var path = require('path');
var moment = require('moment');

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

  let weather = {};
  let processed = {};
  let found_locations = {};

  let location_details = new LocationData({locations})

  attach_location_logs(location_details, silent);

  location_details.on('data', () => {
    // look through all locations and set watcher on forcast details that update our location
    // weather data
    for (let location of location_details.data){
      found_locations[location.id] = location;
      let forcast_details = new ForcastData({token, interval, location, units})
      attach_forcast_logs(forcast_details, silent);
      // can be called multiple tiles over the interval to update our weather
      forcast_details.on('data', () => {
        weather[location.id] = forcast_details.data;
        processed[location.id] = process_forcast(forcast_details.data);
      })
      forcast_details.fetch();
    }
  });

  // app.use((req, res, next) => {
  //   if (forcast_details.ready) return next();
  //   forcast_details.once('ready', next);
  // });

  var exphbs  = require('express-handlebars');
  app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: 'hbs',
    helpers: {
      rating_color_class: function(score) {
        var rating_map = {
          45: 'success',
          80: 'warning',
          100: 'danger'
        }
        for ( var high_score in rating_map ) {
          if (score > high_score) continue;
          return rating_map[high_score];
        }
        return 'danger';
      },
      weekday_date: function(unix_date, format='dddd') {
        let date = moment(unix_date, 'X');
        return date.format('dddd, Do');
      }
    }
  }));
  app.set('view engine', 'hbs');
  app.set('views', path.resolve(__dirname, '../views'));

  app.get('/', (req, res) => {
    res.type('html');
    res.render('landing', {
      ratings: processed,
      locations: found_locations
    });
  });

  // static files
  let assets = path.resolve(__dirname, '../assets');
  app.use('/assets', express.static(assets));

  app.get('/all.json', (req, res) => {
    return res
      .status(200)
      .json({ratings: processed, locations: found_locations, weather});
  });

  app.get('/:id/is-it-good.json', (req, res) => {
    let id = req.params.id;
    let good = processed[id].currently.overall < 50;
    let location = found_locations[id];
    let ratings = processed[id];
    return res
      .status(200)
      .json({good, location, ratings});
  });

  // set things in motion
  location_details.fetch_locations();

  return srv;
}
