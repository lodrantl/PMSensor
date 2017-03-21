import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { Influx } from '../../providers/influx'
import { PmConfig, PmChart, PmBox } from '../../models/config'

@Component({
  selector: 'page-graph',
  templateUrl: 'graph.html'
})
export class GraphPage {
  chartOptions: any;
  chartInstance: any;
  sub: any;

  id: string;
  current: PmChart;

  constructor(public navCtrl: NavController, public navParams: NavParams, public storage: Storage, public influx: Influx) {
    this.current = new PmChart(10, 20, new Date(), [[1, 2, 3], [1, 2, 4]]);


    //chart configuration
    this.chartOptions = {
      chart: {
        type: 'spline',
        zoomType: "x"
      },
      yAxis: {
        title: {
          useHTML: true,
          text: 'Število delcev [&#181;g/m<sup>3</sup>]'
        }
      },
      tooltip: {
        style: {
          padding: 10,
          fontWeight: 'bold'
        }
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
          month: '%e. %b',
          year: '%b'
        },
        title: {
          text: 'Ura'
        }
      },
      //The below properties are watched separately for changes.
      //Title configuration (optional)
      title: {
        text: 'Prašni delci v zraku'
      },
      series: [{
        name: "PM 10",
        color: "blue",
        data: [],
        marker: {
          enabled: false
        }
      }, {
        name: "PM 2.5",
        color: "red",
        data: [],
        marker: {
          enabled: false
        }
      }],
      //Boolean to control showing loading status on chart (optional)
      //Could be a string if you want to show specific loading text.
      loading: false,
      //Whether to use Highstocks instead of Highcharts (optional). Defaults to false.
      useHighStocks: false
    };
  }

  saveChartInstance(chartInstance) {
    this.chartInstance = chartInstance;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad GraphPage');
  }

  ionViewWillLeave() {
    if (this.sub) {
      this.sub.unsubscribe()
    }
  }

  ionViewWillEnter() {
    this.storage.set('config', new PmConfig(new PmBox('random', 'https://haag.artes.si:8086'), 's', 60)).then(() => {
      this.storage.get("config").then(b => {
        this.id = b.box.id;
      });
    });

    this.sub = this.influx.getChart().subscribe(
      (x) => {
        this.current = x;
        this.chartInstance.series[0].setData(x.series[0], false, false, false);
        this.chartInstance.series[1].setData(x.series[1], false, false, false);
        this.chartInstance.redraw();
      });
  }

}
