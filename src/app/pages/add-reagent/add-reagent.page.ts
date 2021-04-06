import { Component, OnInit} from '@angular/core';
import {Validators, FormBuilder, FormGroup, FormControl,FormArray } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { AuthService } from './../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-reagent',
  templateUrl: 'add-reagent.page.html',
  styleUrls: ['add-reagent.page.scss']
})
export class AddReagentPage implements OnInit {
  reagentForm: FormGroup;
  scannedCode: any;
  baseURI: string = environment.url;
  httpOptions: any;
  reagents: FormArray;
  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,
    private authService: AuthService, 
   ) {}
  ngOnInit(){
    this.createStaticControl()
  };

  createStaticControl(){
    this.reagentForm = this.fb.group({
      reagentName: [''],
      lotNr:[''],
      dateCreated:[this.myDate],
      expiryDate:[''],
      reagents: this.fb.array([]),
    });

  }
  myDate: String = new Date().toISOString();
  /*addComponent(){
    this.reagents.push(this.fb.control(''));
  };*/
    // Add/remove equipment
  createComponent(): FormGroup {
    return this.fb.group({
    reagent:[''],
    lotNr: [''], });
  }
  addComponent(): void {
    this.reagents = this.reagentForm.get('reagents') as FormArray;
    this.reagents.push(this.createComponent());
  }

  removeCurrentComponent(index){
     this.reagents.removeAt(index)

  };

  getDate(e) {
    let date = new Date(e.target.value).toISOString();
    this.reagentForm.get(e.target.getAttribute('formControlName')).setValue(date, {
       onlyself: true
    })
  }

  async onSubmit(){
    const alert = await this.alertCtrl.create({
      header: 'Save',
      message: 'Do you want to save this record?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Save: No');
          }
        }, {
          text: 'Yes',
          handler: () => {
            console.log('Save Yes');
            console.log("submitted value", this.reagentForm.value);
            let reqArray = [];

            // request to save test            
            const submitUrl = this.baseURI + "secondary-reagents";
            const submitReq = this.http.post(submitUrl, this.reagentForm.value);
            console.log(this.reagentForm.value)
            reqArray.push(submitReq);

            // requests to update reagent 
            for (let i in this.reagentForm.get('reagents').value){
              console.log(i)
              const reagentID = this.reagentForm.get('reagents').get(i).get('reagent').value
              // primary reagents              
              const priReagentUpdateUrl = this.baseURI + "reagents/" + reagentID;
              const priReagentUpdateReq = this.http.put(
                priReagentUpdateUrl, 
                {}, 
                {params: new HttpParams().set("action", "firstTest")});
              reqArray.push(priReagentUpdateReq);

              // secondary reagents
              const secReagentUpdateUrl = this.baseURI + "secondary-reagents/" + reagentID;
              const secReagentUpdateReq = this.http.put(
                secReagentUpdateUrl, 
                {}, 
                {params: new HttpParams().set("action", "firstTest")});
              reqArray.push(secReagentUpdateReq);
            };

            // post to database
            forkJoin(reqArray)
              .subscribe((data: any[]) => {
                console.log("submission result:", data);

                // reset form control
                this.createStaticControl();

                // prompt confirmation box
                this.confirmBox('Record saved!');
              }, error => {
                this.confirmBox(error.message);
                console.log(error)
              });
          }
        }
      ]
    });
    await alert.present();
  }

  scan(key: number) {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;
      //this.confirmBox()
      // Patch value to form
      const newNestedArray = this.reagentForm.get('reagents') as FormArray;
      const newNestedGroup = newNestedArray.controls[key.toString()];
      newNestedGroup.controls['reagent'].patchValue(this.scannedCode.text);
      this.getReagent(key)
    }).catch(err => {
      console.log('Error', err);
    });
  }
  async showReagent(info: any, key: string, type: string) {

    // set header 
    let headerText = '';
    const expiryDateFormatted = new Date(info.expiryDate).getTime();
    const dateNow = new Date().getTime();
    if (expiryDateFormatted < dateNow){
      headerText = "Reagent Expired!";
    }
    else {
      headerText = "";
    }

    // set message
    let messageText = 
      'Reagent Type: '+type+'<br>'+
      'Lot Number: '+info.lotNr+'<br>'+
      'Expiry Date: '+info.expiryDate.substring(0,10)+'<br>'+
      'Status: '+info.status;

    const alert = await this.alertCtrl.create({
      header: headerText,
      subHeader: "ID: " + info._id,
      message: messageText,
      buttons: [
        {
          text: 'Remove',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Show reagent: remove');
            this.reagentForm.get('reagents').get(key.toString()).get('reagent').patchValue('');
          }
        }, 
        {
          text: 'Add',
          handler: () => {
            console.log('Show reagent: ok');
          }
        }
      ]
    });
    await alert.present();
  }

  getReagent( key) {
    //console.log("reagent id changed", event.target.value, key);
    console.log(this.reagentForm.get('reagents').get(key.toString()).get('reagent').value);
   
    if (this.reagentForm.value.reagents[key].reagent !== ""){
      const priReagentUrl = this.baseURI + "reagents";
      const priReagentReq = this.http.get(priReagentUrl+"/"+this.reagentForm.value.reagents[key].reagent);
      const secReagentUrl = this.baseURI + "secondary-reagents";
      const secReagenReq = this.http.get(secReagentUrl+"/"+this.reagentForm.value.reagents[key].reagent);

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
            this.showReagent(data[0], key, 'Primary');
            this.reagentForm.get('reagents').get(key.toString()).get('lotNr').patchValue(data[0].lotNr);
          }//if choose delete in showReagent, the lotNr will still be patched, this may cause problem
          
          //secondary reagent
          else {
            this.showReagent(data[1], key, 'Secondary');
            this.reagentForm.get('reagents').get(key.toString()).get('lotNr').patchValue(data[1].lotNr);
          }
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
    }
  }

  async confirmBox(msg: string) {
    const alert = await this.alertCtrl.create({
      header: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  // log out
  logout() {
    this.authService.logout();
  }
}
