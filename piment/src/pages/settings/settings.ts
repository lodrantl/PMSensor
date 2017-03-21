import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';

import { AddModal } from './add-modal'

import { PmBox } from '../../models/config'

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  boxes: PmBox[];

  openModal() {
    let addModal = this.modalCtrl.create(AddModal);
    addModal.present()
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

}
