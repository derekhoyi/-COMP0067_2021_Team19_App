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
  reagentInfo: any;
  reagentType: string;

  constructor(
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,
    private authService: AuthService, 
  ) {}

  ngOnInit() {
    this.scan();
    // this.getReagent('60593f60654a0e113c4a9883'); 
  }

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
            this.reagentInfo = data[0];
            this.reagentType = 'Primary';

            // change date format
            // if (this.reagentInfo.dateReceived) this.reagentInfo.dateReceived = this.reagentInfo.dateReceived.substring(0,10);
            // if (this.reagentInfo.expiryDate) this.reagentInfo.expiryDate = this.reagentInfo.expiryDate.substring(0,10);
            // if (this.reagentInfo.dateOfFirstUse) this.reagentInfo.dateOfFirstUse = this.reagentInfo.dateOfFirstUse.substring(0,10);
          }
          
          // secondary reagent
          else {
            this.reagentInfo = data[1];
            this.reagentType = 'Secondary';

            // change date format
            // if (this.reagentInfo.dateCreated) this.reagentInfo.dateCreated = this.reagentInfo.dateCreated.substring(0,10);
            // if (this.reagentInfo.expiryDate) this.reagentInfo.expiryDate = this.reagentInfo.expiryDate.substring(0,10);
            // if (this.reagentInfo.dateOfFirstUse) this.reagentInfo.dateOfFirstUse = this.reagentInfo.dateOfFirstUse.substring(0,10);

          }
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
  }
  
  // dispose confirmation
  async disposeConfirm(id, type) {
    const alert = await this.alertCtrl.create({
      header: 'Dispose',
      message: 'Do you want to dispose of the reagent?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Dispose: No');
          }
        }, {
          text: 'Yes',
          handler: () => {
            console.log('Dispose: Yes');
            this.dispose(this.reagentInfo._id, this.reagentType);
          }
        }
      ]
    });
    await alert.present();
  }

  // dispose of a reagent
  dispose(id, type){
    if (id == null || id == '' || type == null || type == ''){
      this.confirmBox('Reagent not found');
      return;
    }

    if ((type == 'Primary')){
      var disposeUrl = this.baseURI + 'reagents' + "/" + id
    } else if ((type == 'Secondary')){
      var disposeUrl = this.baseURI + 'secondary-reagents' + "/" + id
    };

    const disposeReq = this.http.put(
      disposeUrl, 
      {}, 
      {params: new HttpParams().set("action", "discard")});
    disposeReq.subscribe(data => {
      console.log("submission result:", data);
      this.confirmBox('Reagent disposed of!');
      }, error => {
        this.confirmBox(error.message);
        console.log(error)
        }
    );
  };

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

