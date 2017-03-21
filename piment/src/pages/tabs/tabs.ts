import { Component } from '@angular/core';

import { GraphPage } from '../graph/graph';
//import { MeasurementsPage } from '../measurements/measurements';
import { SettingsPage } from '../settings/settings';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = GraphPage;
//  tab2Root: any = MeasurementsPage;
  tab3Root: any = SettingsPage;

  constructor() {

  }
}
