import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { NavParams, ViewController, NavController } from 'ionic-angular';

import { Influx } from '../../providers/influx'
import { PmBox } from '../../models/config'

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';


@Component({
  templateUrl: 'add-modal.html'
})

export class AddModal {
  found: boolean;

  ids: string[] = [];
  state: string = '';

  selectedId: string;

  addForm: FormGroup;

  constructor(public navCtrl: NavController, params: NavParams, public viewCtrl: ViewController, public influx: Influx) {
    this.found = true;

    this.addForm = new FormGroup({
      urlControl: new FormControl('')
    });

    let urlChange = this.addForm.controls['urlControl']
      .valueChanges
      .debounceTime(500)
      .distinctUntilChanged();

    urlChange
      .do(() => {
        this.state = 'loading';
      })
      .switchMap((url) => influx.getIds(url)
        .do(() => {
          this.state = 'ok';
        })
        .catch((error) => {
        this.state = 'error';
        return Observable.of([]);
      }))
      .subscribe(ids => {
        this.ids = ids;
      })
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  create() {
    this.viewCtrl.dismiss(new PmBox(this.addForm.controls['urlControl'].value, this.selectedId));
  }
}