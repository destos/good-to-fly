// Forcast processor

// Do soem data analysis/parsing and figure out which upcoming days
// will be good to fly. take into account heat, percipitation and wind mostly.

let temperatures = {
  us: {
    low: 65,
    optimal: 78,
    high: 100
  }
}

let windspeeds = {
  optimal: 0,
  high: 10
}

// let humidity = {
//
// }

let units = 'us';

let {floor, min, abs} = Math;

export function process_forcast(forcast) {
  let days = forcast.daily.data;
  let previous = null;
  let daily_results = [];
  for (var i = 0; i < days.length; i++) {
    let day = days[i];
    daily_results.push(process_point(previous, day));
    previous = day;
  }
  let currently = process_point(null, forcast.currently);
  return {currently, daily_results};
}

function temperature_rating(temp) {
  let {low, optimal, high} = temperatures[units];
  // let center_diff = temp - optimal;
  let center_diff = optimal - temp;
  let from_center = Math.abs(center_diff);
  if (center_diff > 0) {
    let top = high - optimal;
    return min(floor(100 * (from_center / top)), 100);
  } else {
    let lower = optimal - low;
    return min(floor(100 * (from_center / lower)), 100);
  }
}

function process_point(previous_day, current_day, units='us') {
  // if (previous_day) { }
  let affect = {
    day: current_day.time
  }
  // Take into account temperatures
  let day_ease = 0;
  if (current_day.temperatureMax) {
    let high_ease = temperature_rating(current_day.temperatureMax);
    let low_ease = temperature_rating(current_day.temperatureMin);
    // TODO: bias towards the high ease
    day_ease = floor(( low_ease + (high_ease * 3) ) / 4);
    Object.assign(affect, {
      temp: {high_ease, low_ease, day_ease}
    })

  } else if (current_day.apparentTemperature) {
    day_ease = temperature_rating(current_day.apparentTemperature);
    Object.assign(affect, {
      temp: {ease: day_ease}
    })
  }
  // Take into account win speeds
  let speed_ease = min(floor(( current_day.windSpeed * 100 ) / windspeeds.high ), 100)

  // Take into acount percipitation
  let rain_ease = floor(current_day.precipProbability * 100)

  // Take into account clound cover
  // If there is a lot of cloud cover ( no direct sun = a level of 1 ) It's best for flying.
  let cloud_ease = abs(floor((current_day.cloudCover * 100) - 100))

  let overall = floor((cloud_ease + rain_ease * 3 + speed_ease * 2 + day_ease) / 7)

  Object.assign(affect, {
    winds: {ease: speed_ease},
    percip: {ease: rain_ease},
    clouds: {ease: cloud_ease},
    overall
  });
  return affect;
}
