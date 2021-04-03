import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from "@angular/forms";
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-run-test',
  templateUrl: 'run-test.page.html',
  styleUrls: ['run-test.page.scss']
})
export class RunTestPage {

  testForm: FormGroup;
  scannedCode: any;
  baseURI: string = environment.url;
  testTypesJson: any;
  equipment: FormArray;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient,
    private authService: AuthService, 
  ) { }

  ngOnInit() {
    /* create static form control */
    this.createStaticControl();

    /* retrieve testTypes JSON from server */
    let url = this.baseURI + "test-types";
    this.http.get(url)
      .pipe(
        map((rawdata: any[]) => rawdata.sort((a1, a2) => {
          if(a1.assayName < a2.assayName) return -1;
          if(a1.assayName > a2.assayName) return 1;
          return 0;
        }))
      )
      .subscribe(data => {
      this.testTypesJson = data;
      console.log("JSON from server: ", data);
    }, error => console.log(error));
  }

  // Create static controls
  createStaticControl() {
    this.testForm = this.fb.group({
      batchNr: new FormControl('', Validators.required),
      equipment: this.fb.array([this.createEqpt()]),
      assayName: new FormControl('', Validators.required),
    });
  }

  // Add/remove equipment
  createEqpt(): FormGroup {
    return this.fb.group({ eqptNr: '' });
  }
  addEqpt(): void {
    this.equipment = this.testForm.get('equipment') as FormArray;
    this.equipment.push(this.createEqpt());
  }
  removeEqpt(index) {
    this.equipment.removeAt(index)
  };

  // Create dynamic form controls
  createDynamicControl(controls) {

    // select assay type
    for (let control of controls) {
      if (control.assayName == this.testForm.value.assayName) {
        console.log("Assay selected: " + this.testForm.value.assayName)

        // select metadata
        for (let meta of control.metadata) {

          // 1. reagents
          if (meta.key == "reagents") {
            const reagentArray = new FormArray([]);

            // select children
            meta.children.map(child => {

              // new form group
              const oneGroup = new FormGroup({});

              // fields other than reagent ID
              oneGroup.addControl("key", new FormControl(child.key));
              oneGroup.addControl("label", new FormControl(child.label));
              oneGroup.addControl("lotNr", new FormControl(''));

              // reagent ID
              const fieldControl = new FormControl();
              if (child.required) {
                fieldControl.setValidators(Validators.required);
              }
              oneGroup.addControl("reagent", fieldControl);

              // add to array
              reagentArray.push(oneGroup);

              // add to form
              this.testForm.addControl("reagents", reagentArray);
            });
          }
          // 2. reagentData
          else if (meta.key == "reagentData") {
            const reagentDataArray = new FormArray([]);

            // select children
            meta.children.map(child => {
              // new form group
              const oneGroup = new FormGroup({});

              // fields other than "value"
              oneGroup.addControl("key", new FormControl(child.key));
              oneGroup.addControl("label", new FormControl(child.label));
              oneGroup.addControl("type", new FormControl(child.type));

              // value
              const fieldControl = new FormControl();
              if (child.required) {
                fieldControl.setValidators(Validators.required);
              }
              oneGroup.addControl("value", fieldControl);

              // add to array
              reagentDataArray.push(oneGroup);

              // add to form
              this.testForm.addControl("reagentData", reagentDataArray);
            });
          }
          // 3. other
          else if (meta.key == "other") {
            const otherArray = new FormArray([]);

            // select children
            meta.children.map(child => {

              // new form group
              const oneGroup = new FormGroup({});

              // fields other than "value"
              oneGroup.addControl("key", new FormControl(child.key));
              oneGroup.addControl("label", new FormControl(child.label));
              oneGroup.addControl("type", new FormControl(child.type));

              // value
              const fieldControl = new FormControl();
              if (child.required) {
                fieldControl.setValidators(Validators.required);
              }
              oneGroup.addControl("value", fieldControl);

              // add to array
              otherArray.push(oneGroup);

              // add to form
              this.testForm.addControl("other", otherArray);
            });
          }
        }
      }
    }
    console.log('New form created: ', this.testForm);
  }

  // confirm box
  async confirmBox(msg: string) {
    const alert = await this.alertCtrl.create({
      header: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  // QR code scanner
  scan(key: number) {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;

      // Patch value to form
      const newNestedArray = this.testForm.get('reagents') as FormArray;
      const newNestedGroup = newNestedArray.controls[key.toString()];
      newNestedGroup.controls['reagent'].patchValue(this.scannedCode.text);
      
      // retrieve reagent information
      this.getReagent(key);
    }).catch(err => {
      console.log('Error', err);
    });
  }

  // update form after selecting assay type
  testChange() {
    // reset form control
    const tempAssayName = this.testForm.value.assayName;
    const tempBatchNumber = this.testForm.value.batchNr;
    this.createStaticControl();
    this.testForm.controls.assayName.patchValue(tempAssayName);
    this.testForm.controls.batchNr.patchValue(tempBatchNumber);

    // create dynamic control
    this.createDynamicControl(this.testTypesJson);

    // ask if past record data is needed
    if (this.testForm.controls.assayName.value !== ""){
      this.ifGetLastTest();
    }
  }

  // popup to ask if past record data is needed
  async ifGetLastTest() {
    const alert = await this.alertCtrl.create({
      header: 'Copy from past record',
      message: 'Do you want to copy data from the last test record?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Retrieve record: No');
          }
        }, {
          text: 'Yes',
          handler: () => {
            console.log('Retrieve record: Yes');
            this.getLastTest();
          }
        }
      ]
    });
    await alert.present();
  }

  // retrieve last test record
  getLastTest() {
    let url = this.baseURI + "tests";
    this.http.get(url)
      .pipe(

        // get records of the same assay type
        map((data: any) => {
          console.log("before filter: ", data);
          return data.filter(post => {
            return post.assayName == this.testForm.value.assayName; 
          });
        }),

        // get the last record
        map((data: any) => {
          return data[data.length - 1];
        })
      )
      .subscribe((data: any) => {
        console.log('after filter', data);

        // no past record
        if (data == null) {
          this.confirmBox('No past record');
        }

        // retrieved successfully
        else {
          // this.confirmBox('Last record retrieved');

          // patch value: equipment
          this.testForm.controls.equipment = this.fb.array([]);
          let i: number;
          for (i = 0; i < data.equipment.length; i++) {
            this.addEqpt();
            this.testForm.get('equipment').get(i.toString()).get('eqptNr')
            .patchValue(data.equipment[i].eqptNr);
          }

          // patch value: reagent
          let j: number;
          for (j = 0; j < data.reagents.length; j++) {
            this.testForm.get('reagents').get(j.toString()).get('reagent')
            .patchValue(data.reagents[j].reagent);
            this.testForm.get('reagents').get(j.toString()).get('lotNr')
            .patchValue(data.reagents[j].lotNr);
          }

          // patch value: reagentData
          let k: number;
          for (k = 0; k < data.reagentData.length; k++) {
            this.testForm.get('reagentData').get(k.toString()).get('value')
            .patchValue(data.reagentData[k].value);
          }

          // patch value: other
          let m: number;
          for (m = 0; m < data.other.length; m++) {
            this.testForm.get('other').get(m.toString()).get('value')
            .patchValue(data.other[m].value);
          }
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
  }

  // clear lotNr if reagent id is empty
  clearLotNumberIfEmpty(event, key){
    if(event.target.value == ''){
      this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue('');
    }
  }

  // retrieve reagent lot number and other information using ID
  getReagent(key) {
    console.log("reagent id changed", key);
    this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue('');

    if (this.testForm.value.reagents[key].reagent !== ""){
      const priReagentUrl = this.baseURI + "reagents";
      const priReagentReq = this.http.get(priReagentUrl+"/"+this.testForm.value.reagents[key].reagent);
      const secReagentUrl = this.baseURI + "secondary-reagents";
      const secReagenReq = this.http.get(secReagentUrl+"/"+this.testForm.value.reagents[key].reagent);

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
            this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue(data[0].lotNr);
          }
          
          //secondary reagent
          else {
            this.showReagent(data[1], key, 'Secondary');
            this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue(data[1].lotNr);
          }
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
    }
  }

  async showReagent(info: any, key: string, type: string) {

    // set header 
    let headerText = '';
    const expiryDateFormatted = new Date(info.expiryDate).getTime();
    const dateNow = new Date().getTime();
    if (expiryDateFormatted < dateNow){
      headerText = headerText.concat("Reagent expired! ");
    };
    if (info.status == "DISPOSED"){
      headerText = headerText.concat("Reagent is marked for disposal!");
    };

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
            this.testForm.get('reagents').get(key.toString()).get('reagent').patchValue('');
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

  // Format date (to use: insert "(ionChange)="getDate($event,d.key,i)" into ion-datetime)
  // getDate(event, arrayName, key) {
  //   if (event.target.value !== ""){
  //     let date = new Date(event.target.value).toISOString(); //substring(0, 10)
  //     const oneFormArray = this.testForm.get(arrayName) as FormArray;
  //     const oneRecord = oneFormArray.controls[key] as FormGroup;
  //     oneRecord.controls.value.setValue(date, {
  //       onlyself: true
  //     })
  //   }
  // }

  // add clear button to date picker
  dateArrayName: string;
  dateKey: string;
  setUpDatePicker(arrayName, key) {
    this.dateArrayName = arrayName;
    this.dateKey = key;
    // console.log(this.dateArrayName, this.dateKey);
  }
  customPickerOptions = {
    buttons: [{
      text: 'Cancel',
      role:'cancel',
      handler: () => {}
    },{
      text: 'Clear',
      handler: () => {
        this.testForm.get(this.dateArrayName).get(this.dateKey.toString()).get('value')
        .patchValue(null);
      }
    }, {
      text: 'Save',
      handler: (data) => {
        // console.log('Data', data);      
        const dateNow = new Date();
        let year: string = data.year.text;
        let month: string = data.month.value < 10 ? '0' + data.month.value.toString(): data.month.value.toString();
        let day: string = data.day.text;
        let rest: string = dateNow.toISOString().substring(11,); // set hh:mm:ss:mmmm
        console.log(year + '-' + month + '-' + day +'T' + rest);
        this.testForm.get(this.dateArrayName).get(this.dateKey.toString()).get('value')
        .patchValue(year + '-' + month + '-' + day +'T' + rest);
      }
    }]
  }
   
  // Submit form
  async submitForm() {
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
            console.log("submitted value", this.testForm.value);
            let reqArray = [];

            // request to save test            
            const submitUrl = this.baseURI + "tests";
            const submitReq = this.http.post(submitUrl, this.testForm.value);
            reqArray.push(submitReq);

            // requests to update reagent 
            for (let i in this.testForm.value.reagents){
              const reagentID = this.testForm.value.reagents[i].reagent
              
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

  // log out
  logout() {
    this.authService.logout();
  }
}

