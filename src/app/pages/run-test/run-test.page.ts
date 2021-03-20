import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from "@angular/forms";
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Variable } from '@angular/compiler/src/render3/r3_ast';
import { HttpClient } from '@angular/common/http';
import testTypesJsonLocal from "../../../assets/test_form_new.json"
import { decimalDigest } from '@angular/compiler/src/i18n/digest';

@Component({
  selector: 'app-run-test',
  templateUrl: 'run-test.page.html',
  styleUrls: ['run-test.page.scss']
})
export class RunTestPage {

  testForm: FormGroup;
  scannedCode: any;
  baseURI: string = "http://localhost:3000/";
  testTypesJson: any;
  equipment: FormArray;
  username: string = "dummyuser";
  lastTest: any;
  reagentLotNumber: any;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient
  ) { }

  ngOnInit() {
    /* create static form control */
    this.createStaticControl();

    /* retrieve testTypes JSON from server */
    let url = this.baseURI + "testTypes";
    this.http.get(url).subscribe(data => {
      this.testTypesJson = data;
      console.log("JSON from server: ", data);
    }, error => console.log(error));

    /* temp: retrieve from local*/
    // this.testTypesJson = testTypesJsonLocal;
    // console.log("JSON from local: ", testTypesJsonLocal);
  }

  // Create static controls
  createStaticControl() {
    this.testForm = this.fb.group({
      batchNumber: [''], //new FormControl('', Validators.required),
      conductedBy: [this.username],
      equipment: this.fb.array([this.createEqpt()]),
      assayName: [''], //new FormControl('', Validators.required),
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
        console.log("correct assay: " + this.testForm.value.assayName)

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
    console.log('My form: ', this.testForm);
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
  scan(key: string) {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;

      // Patch value to form
      const newNestedArray = this.testForm.get('reagents') as FormArray;
      const newNestedGroup = newNestedArray.controls[key];
      newNestedGroup.controls['reagent'].patchValue(this.scannedCode.text);
    }).catch(err => {
      console.log('Error', err);
    });
  }

  // update form after selecting assay type
  testChange() {
    // reset form control
    const tempAssayName = this.testForm.value.assayName;
    const tempBatchNumber = this.testForm.value.batchNumber;
    this.createStaticControl();
    this.testForm.controls.assayName.patchValue(tempAssayName);
    this.testForm.controls.batchNumber.patchValue(tempBatchNumber);

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
    let url = this.baseURI + "getTest";
    this.lastTest = null;
    this.http.get(url, { params: { "assayName": this.testForm.value.assayName } }).subscribe(data => {
      this.lastTest = data;
      console.log("Last test from server: ", this.lastTest, "length: ", this.lastTest.length);

      // no past record
      if (this.lastTest.length == 0) {
        this.confirmBox('No past record');
      }

      // retrieved successfully
      else {
        // this.confirmBox('Last record retrieved');

        // patch value: equipment
        this.testForm.controls.equipment = this.fb.array([]);
        let i: number;
        for (i = 0; i < this.lastTest[0].equipment.length; i++) {
          this.addEqpt();
          this.testForm.get('equipment').get(i.toString()).get('eqptNr')
          .patchValue(this.lastTest[0].equipment[i].eqptNr);
        }

        // patch value: reagent
        let j: number;
        for (j = 0; j < this.lastTest[0].reagents.length; j++) {
          this.testForm.get('reagents').get(j.toString()).get('reagent')
          .patchValue(this.lastTest[0].reagents[j].reagent);
          this.testForm.get('reagents').get(j.toString()).get('lotNr')
          .patchValue(this.lastTest[0].reagents[j].lotNr);
        }

        // patch value: reagentData
        let k: number;
        for (k = 0; k < this.lastTest[0].reagentData.length; k++) {
          this.testForm.get('reagentData').get(k.toString()).get('value')
          .patchValue(this.lastTest[0].reagentData[k].value);
        }

        // patch value: other
        let m: number;
        for (m = 0; m < this.lastTest[0].other.length; m++) {
          this.testForm.get('other').get(m.toString()).get('value')
          .patchValue(this.lastTest[0].other[m].value);
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
  getReagentLotNumber(event, key) {
    console.log("reagent id changed", event.target.value, key);
    let url = this.baseURI + "reagentLot";
    this.reagentLotNumber = "";
    this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue('');

    if (this.testForm.value.reagents[key].reagent !== ""){
      this.http.get(url, { params: { "reagent": this.testForm.value.reagents[key].reagent }})
      .subscribe(data => {
        this.reagentLotNumber = data;
        console.log("Last test from server: ", this.reagentLotNumber, "length: ", this.reagentLotNumber.length);
        
        // invalid id: pop up
        if (this.reagentLotNumber.length == 0){
          this.confirmBox('No record found');
        }
        // valid id: show information and patch value
        else {
          this.showReagent(this.reagentLotNumber, key);
          this.testForm.get('reagents').get(key.toString()).get('lotNr').patchValue(this.reagentLotNumber[0].lotNr);
        }
      }, error => {
        console.log(error);
        this.confirmBox('Cannot retrieve data');
      });
    }
  }

  async showReagent(info: any, key: string) {

    let headerText = '';
    const expiryDateFormatted = new Date(info[0].expiryDate).getTime();
    const dateNow = new Date().getTime();
    console.log("expiry date", expiryDateFormatted);
    console.log("date now", dateNow);

    if (expiryDateFormatted < dateNow){
      headerText = "Reagent Expired!";
    }
    else {
      headerText = "";
    }
    let messageText = 
      'Reagent Type: '+info[1].type+'<br>'+
      'Lot Number: '+info[0].lotNr+'<br>'+
      'Expiry Date: '+info[0].expiryDate.substring(0,10);

    const alert = await this.alertCtrl.create({
      header: headerText,
      subHeader: "ID: " + info[0]._id,
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
  getDate(event, arrayName, key) {
    if (event.target.value !== ""){
      let date = new Date(event.target.value).toISOString(); //substring(0, 10)
      const oneFormArray = this.testForm.get(arrayName) as FormArray;
      const oneRecord = oneFormArray.controls[key] as FormGroup;
      oneRecord.controls.value.setValue(date, {
        onlyself: true
      })
    }
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

            // post to database
            let url = this.baseURI + "addTest";
            console.log(url);
            console.log(this.testForm.value);
            this.http.post(url, this.testForm.value).subscribe(data => {
              console.log("submission result:", data);

              // reset form control
              this.createStaticControl();

              // prompt confirmation box
              this.confirmBox('Record saved!');
            }, error => console.log(error));
          }
        }
      ]
    });
    await alert.present();
  }
}

