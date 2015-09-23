import dbg from 'debug';
const debug = dbg('gtf');

export default function log(forcast, google, silent){
  // keep track of elapsed time
  let last;

  out('fetching');

  // attach events
  forcast.on('ready', () => out('ready'));
  forcast.on('retry', () => out('retrying'));
  forcast.on('fetch', () => {
    last = new Date;
    out('fetching');
  });
  // forcast.on('data', online);
  //
  // // log online users
  // function online(){
  //   out('online %d, total %d %s',
  //     forcast.users.active,
  //     forcast.users.total,
  //     last ? `(+${new Date - last}ms)` : '');
  // }

  // print out errors and warnings
  if (!silent) {
    forcast.on('error', (err) => {
      console.error('%s – ' + err.stack, new Date);
    });
  }

  function out(...args){
    if (silent) return debug(...args);
    args[0] = `${new Date} – ${args[0]}`;
    console.log(...args);
  }
}
