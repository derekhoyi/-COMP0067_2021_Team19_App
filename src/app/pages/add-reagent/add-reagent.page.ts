import { Component, OnInit} from '@angular/core';
import {Validators, FormBuilder, FormGroup, FormControl,FormArray } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';


@Component({
  selector: 'app-add-reagent',
  templateUrl: 'add-reagent.page.html',
  styleUrls: ['add-reagent.page.scss']
})
export class AddReagentPage implements OnInit {
  reagentForm: FormGroup;
  scannedCode: any;
  username: string = "60593f60654a0e113c4a9858";
  baseURI: string = "http://localhost:3000/";
  httpOptions: any;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,

   ) {}
  ngOnInit(){
    this.createStaticControl()
    this.httpOptions = {
      headers: new HttpHeaders({
          'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDU5M2Y2MDY1NGEwZTExM2M0YTk4NTgiLCJpYXQiOjE2MTY0NjE2NzUsImV4cCI6MTYxNzA2NjQ3NX0.FdC60ZOScRB9PexVD2xav_dsKvoQJOmP6fbw35sw_s4' //localStorage.getItem("token")
      })
    };

  };

  createStaticControl(){
    this.reagentForm = this.fb.group({
      reagentName: [''],
      lotNr:[''],
      createdBy:[this.myDate],
      dateCreated:[''],
      expiryDate:[''],
      Composition: this.fb.array([]),
    });

  }
  myDate: String = new Date().toISOString();
  addComponent(){
    this.Composition.push(this.fb.control(''));
  };

  removeCurrentComponent(index){
     this.Composition.removeAt(index)

  };

  get Composition() {
    return this.reagentForm.get('Composition') as FormArray;
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
            const submitReq = this.http.post(submitUrl, this.reagentForm.value, this.httpOptions);
            console.log(this.reagentForm.value)
            // post to database
            submitReq
              .subscribe(data => {
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

  scan(key: string) {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;

      // Patch value to form
      const newNestedArray = this.reagentForm.get('Composition') as FormArray;
      const newNestedGroup = newNestedArray.controls[key];
      newNestedGroup.controls['Composition'].patchValue(this.scannedCode.text);
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
            this.reagentForm.get('Composition').get(key.toString()).patchValue('');
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

  getReagent(event, key) {
    console.log("reagent id changed", event.target.value, key);
    console.log(this.reagentForm.get('Composition').get(key.toString()).value);
   
    if (this.reagentForm.value.Composition[key] !== ""){
      const priReagentUrl = this.baseURI + "reagents";
      const priReagentReq = this.http.get(priReagentUrl+"/"+this.reagentForm.value.Composition[key], this.httpOptions);
      const secReagentUrl = this.baseURI + "secondary-reagents";
      const secReagenReq = this.http.get(secReagentUrl+"/"+this.reagentForm.value.Composition[key], this.httpOptions);

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
            this.reagentForm.get('Composition').get(key.toString()).patchValue(data[0].lotNr);
          }
          
          //secondary reagent
          else {
            this.showReagent(data[1], key, 'Secondary');
            this.reagentForm.get('Composition').get(key.toString()).patchValue(data[1].lotNr);
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

}
