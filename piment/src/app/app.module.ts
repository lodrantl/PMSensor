import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

import { ChartModule } from 'angular2-highcharts';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
import * as highcharts from 'highcharts';

import { MyApp } from './app.component';
import { GraphPage } from '../pages/graph/graph';
//import { MeasurementsPage } from '../pages/measurements/measurements';
import { SettingsPage } from '../pages/settings/settings';
import { AddModal } from '../pages/settings/add-modal'

import { TabsPage } from '../pages/tabs/tabs';

import { Influx } from '../providers/influx'


export function highchartsFactory() {
  return highcharts;
}

@NgModule({
  declarations: [
    MyApp,
    GraphPage,
    AddModal,
 //   MeasurementsPage,
    SettingsPage,
    TabsPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    ChartModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    GraphPage,
//    MeasurementsPage,
    SettingsPage,
    TabsPage,
    AddModal
  ],
  providers: [
    Influx,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    { provide: HighchartsStatic, useFactory: highchartsFactory }
  ]
})
export class AppModule { }
