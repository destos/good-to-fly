import async from 'async'
import dbg from 'debug';
const debug = dbg('gtf');

function out(prefix, silent, ...args){
  if (silent) return debug(...args);
  args[0] = `${new Date} [${prefix}] – ${args[0]}`;
  console.log(...args);
}

export function attach_location_logs(google, silent){
  let log = async.apply(out, 'Location', silent);
  // location events
  google.on('fetch', (location) => log(`fetching ${location}`));
  google.on('fetched', (location) => log(`${location.address} fetched`));

  // print out errors and warnings
  if (!silent) {
    google.on('error', (err) => {
      console.error('%s – ' + err.stack, new Date);
    });
  }
}

export function attach_forcast_logs(forcast, silent){
  let log = async.apply(out, 'Forcast', silent);
  // keep track of elapsed time
  let last;

  // lookup events
  // forcast.on('ready', () => log('ready'));
  forcast.on('retry', () => log('retrying'));
  forcast.on('fetch', () => {
    last = new Date;
    log('fetching forcast data.');
  });

  forcast.on('data', () => {
    log('currently %s', forcast.data.currently.summary);
  });

  // print out errors and warnings
  if (!silent) {
    forcast.on('error', (err) => {
      console.error('%s – ' + err.stack, new Date);
    });
  }
}
