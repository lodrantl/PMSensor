import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Response, QueryEncoder } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/interval';

import { Storage } from '@ionic/storage';

import { Measurement } from '../models/measurement'
import { PmChart } from '../models/config'


@Injectable()
export class Influx {

  constructor(public http: Http, public storage: Storage) {
  }

  private static query(data, time, id): string {
    return ' SELECT ' + data + ' FROM pm_policy.particulates WHERE sensor_id = \'' + id + '\' AND time > ' + time + ' ';
  }

  private static groupTime(time, unit) {
    let g = time / 150;
    return ' GROUP BY *, time(' + Math.ceil(g) + unit + ') ';
  }

  private static parseInfluxSeries(input) {
    let e = [];
    if (input && input.length > 0) {
      let series = input[0];
      for (let i = 0; i < series.values.length; i++) {
        let value = series.values[i];
        let object = {};
        for (let j = 0; j < value.length; j++) {
          object[series.columns[j]] = value[j]
        }
        e.push(object);
      }
    }

    return e;
  }

  private chartRequest() {
    return Observable.fromPromise(this.storage.get("config"))
      .concatMap(c => {
        let params = new URLSearchParams('', new InfluxQueryEncoder());
        params.set('db', 'pm');
        params.set('q', Influx.query('pm_25,pm_10', 'now() - 5m', c.box.id) + 'ORDER BY time DESC LIMIT 1;' +
          Influx.query('MEAN(pm_10), MEAN(pm_25)', 'now() - ' + c.time + c.unit, c.box.id) + Influx.groupTime(c.time, c.unit));

        return this.http.get(c.url + "/query", { search: params })
          .map((res: Response) => {
            let data = res.json();
            let ans;
            if (data.results.length > 0 && data.results[0].series) {
              ans = Influx.parseInfluxSeries(data.results[0].series)[0];
            } else {
              ans = { pm_10: null, pm_25: null, time: null };
            }

            ans.series = [[], []];
            if (data.results.length > 1 && data.results[1].series && data.results[1].series.length > 0) {
              let vals = data.results[1].series[0].values;
              for (let i = 0; i < vals.length; i++) {
                let point = vals[i];
                let date = (new Date(point[0])).getTime();
                if (point[1] != null) {
                  ans.series[0].push([date, Math.round(10 * point[1]) / 10]);
                }
                if (point[2] != null) {
                  ans.series[1].push([date, Math.round(10 * point[2]) / 10]);
                }
              }
            }
            return <PmChart>ans;
          })
          .catch(error => Observable.of(new PmChart(null, null, null, [[], []])))
      });
  }

  getChart(): Observable<PmChart> {
    let pollingSubscription = this.chartRequest()
      .expand(() => Observable.timer(1000).flatMap(this.chartRequest.bind(this)));

    return pollingSubscription;
  }

  getIds(url): Observable<string[]> {
    let query = 'SELECT * FROM pm_policy.particulates GROUP BY sensor_id LIMIT 1';
    let params = new URLSearchParams();
    params.set('db', 'pm');
    params.set('q', query);

    return this.http.get(url + "/query", { search: params })
      .map((res: Response) => {
        let data = res.json()

        let ids = [];
        let series = data.results[0].series;

        if (series) {
          for (var i = 0; i < series.length; i++) {
            if (series[i].tags && series[i].tags.sensor_id) {
              ids.push(series[i].tags.sensor_id);
            }
          }
        }
        return ids;
      });
  }

  getMeasurements(): Observable<Measurement[]> {
    return Observable.fromPromise(this.storage.get("config")).flatMap(c => {
      let query = 'SELECT starts,ends,comment,time FROM event_policy.events WHERE sensor_id = \'' + c.id + "'";
      let params = new URLSearchParams();
      params.set('db', 'pm');
      params.set('q', query);

      return this.http.get(c.url + "/query", { search: params })
        .map((res: Response) => res.json())
    });
  }
}

class InfluxQueryEncoder extends QueryEncoder {
  encodeKey(k: string): string {
    return super.encodeKey(k).replace(/;/gi, '%3B');
  }

  encodeValue(v: string): string {
    return super.encodeKey(v).replace(/;/gi, '%3B');
  }
}
