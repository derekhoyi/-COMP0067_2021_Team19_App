import { Component, OnInit} from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AuthService } from './../../services/auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-scanner',
  templateUrl: 'scanner.page.html',
  styleUrls: ['scanner.page.scss']
})
export class ScannerPage {
  scannedCode: any;
  scannedCodeText: string;
  baseURI: string = environment.url;
  httpOptions: any;

  constructor(
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,
    private authService: AuthService, 
  ) {}

  scan() {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;
      this.scannedCodeText = this.scannedCode.text;
      this.getReagent(this.scannedCodeText)
      //this.confirmBox(this.scannedCodeText);
      //return this.scannedCodeText;
    }).catch(err => {
      console.log('Error', err);
    });
  }
  getReagent(reagentID) {
      const priReagentUrl = this.baseURI + "reagents";
      const priReagentReq = this.http.get(priReagentUrl+"/"+reagentID);
      const secReagentUrl = this.baseURI + "secondary-reagents";
      const secReagenReq = this.http.get(secReagentUrl+"/"+reagentID);

      forkJoin([priReagentReq, secReagenReq])
      .subscribe((data: any[]) => {
        console.log("Reagent data from server: ", data);

        // invalid id: pop up
        if ((data[0] == null) && (data[1] == null)){
          this.confirmBox('No record found');
        }

        // valid id: show information and patch value
        else{

          // primary reagent
          if ((data[0] !== null)){
            this.showReagent(data[0], 'Primary');
          }
          
          //secondary reagent
          else {
            this.showReagent(data[1], 'Secondary');
          }
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
  }
  async showReagent(info: any, cat: string) {

    // set header 
    let headerText = '';
    let type = '';
    const expiryDateFormatted = new Date(info.expiryDate).getTime();
    const dateNow = new Date().getTime();
    if (expiryDateFormatted < dateNow){
      headerText = "Reagent Expired";
    }
    else {
      headerText = "";
    }
    if (cat == 'Primary'){
      type = 'reagents';
    } else{
      type = 'secondary-reagents';
    }
    // set message
    let messageText = 
      'Reagent Type: '+cat+'<br>'+
      'Lot Number: '+info.lotNr+'<br>'+
      'Expiry Date: '+info.expiryDate.substring(0,10)+'<br>'+
      'Status: '+info.status;

    const alert = await this.alertCtrl.create({
      header: headerText,
      subHeader: "ID: " + info._id,
      message: messageText,
      buttons: [
        {
          text: 'dispose',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            const disposeUrl = this.baseURI + type + "/" + info._id
            const disposeReq = this.http.put(disposeUrl, {},{params: new HttpParams().set("action", "discard")});
            console.log('Show reagent: dispose');
          }
        }, 
        {
          text: 'back',
          handler: () => {
            console.log('Show reagent: ok');
            this.scan()
          }
        }
      ]
    });
    await alert.present();
  }
  ngOnInit() {
    this.scan()
  }
  
  // log out
  logout() {
    this.authService.logout();
  }
  async confirmBox(msg: string) {
    const alert = await this.alertCtrl.create({
      header: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

}

