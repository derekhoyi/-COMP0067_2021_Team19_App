import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from "@angular/forms";
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { Variable } from '@angular/compiler/src/render3/r3_ast';
import { HttpClient } from '@angular/common/http';
import testTypesJsonLocal from "../../../assets/test_form_new.json"

@Component({
  selector: 'app-run-test',
  templateUrl: 'run-test.page.html',
  styleUrls: ['run-test.page.scss']
})
export class RunTestPage {
  
  testForm: FormGroup;
  scannedCode: any;
  baseURI : string  = "http://localhost:3000/";
  testTypesJson: any;
  equipment: FormArray;

  constructor(
    private fb: FormBuilder, 
    private alertCtrl: AlertController, 
    private barcodeScanner: BarcodeScanner,
    private http: HttpClient
  ){}

  ngOnInit() {
    /* create static form control */
    this.testForm = this.fb.group({
      assayName: [''], //new FormControl('', Validators.required),
      batchNumber: [''], //new FormControl('', Validators.required),
      equipment: this.fb.array([this.createEqpt()])
    });

    /* retrieve testTypes JSON from server */
    // let url = this.baseURI + "testTypes";
		// this.http.get(url).subscribe(data => {
		// 	this.testTypesJson = data;  
		// 	console.log("JSON from server: ", data);
		// }, error => console.log(error));

    /* temp: retrieve from local*/
    this.testTypesJson = testTypesJsonLocal;
    console.log("JSON from local: ", testTypesJsonLocal);
  } 

  // Equipment: add/remove
  createEqpt(): FormGroup {
    return this.fb.group({
      eqptNr: ''
    });
  }
  addEqpt(): void {
    this.equipment = this.testForm.get('equipment') as FormArray;
    this.equipment.push(this.createEqpt());
  }
  removeEqpt(index){
    this.equipment.removeAt(index)
  };

  // Reagents/Others: Create dynamic form controls
  createControl(controls){
    
    // select assay type
    for (let control of controls){
      if (control.assayName == this.testForm.value.assayName){
        console.log("correct assay: " + this.testForm.value.assayName)

        // select metadata
        for (let meta of control.metadata){
        
          // 1. reagents
          
          if (meta.key == "reagents"){
            const reagentArray = new FormArray([]);

            // select children
            meta.children.map(child => {
              // new form group
              const oneGroup = new FormGroup({});
              
              // fields other than reagent ID
              oneGroup.addControl("key", new FormControl(child.key));
              oneGroup.addControl("label", new FormControl(child.label));
              oneGroup.addControl("lotNr", new FormControl());

              // reagent ID
              const reagentIDControl = new FormControl();
              if (child.required){ 
                reagentIDControl.setValidators(Validators.required);
              }
              oneGroup.addControl("reagent", reagentIDControl);

              // add to array
              reagentArray.push(oneGroup);

              // add to form
              this.testForm.addControl("reagents", reagentArray);
            });
          }
          // 2. reagentData
          else if (meta.key == "reagentData"){
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
              const reagentIDControl = new FormControl();
              if (child.required){ 
                reagentIDControl.setValidators(Validators.required);
              }
              oneGroup.addControl("value", reagentIDControl);

              // add to array
              reagentDataArray.push(oneGroup);

              // add to form
              this.testForm.addControl("reagentData", reagentDataArray);
            });
          }
          // 3. other
          else if (meta.key == "other"){
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
              const reagentIDControl = new FormControl();
              if (child.required){ 
                reagentIDControl.setValidators(Validators.required);
              }
              oneGroup.addControl("value", reagentIDControl);

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

  // update form after selecting assay type
  testChange(){
    console.log('changed');

    // reset form control
    this.testForm = this.fb.group({
      assayName: [this.testForm.value.assayName], //new FormControl('', Validators.required),
      batchNumber: [this.testForm.value.batchNumber], //new FormControl('', Validators.required),
      equipment: this.fb.array([this.createEqpt()])
    });

    // create new control
    this.createControl(this.testTypesJson);
  }

  // Submit form
  async submitForm(){
    const alert = await this.alertCtrl.create({
      header: 'Your Form',
      message: JSON.stringify(this.testForm.value),
      buttons: ['OK']
    });

    await alert.present();
    console.log(this.testForm.value);
  }
  
  // Format date
  getDate(event,arrayName,key) {
    let date = new Date(event.target.value).toISOString(); //substring(0, 10)
    const oneFormArray = this.testForm.get(arrayName) as FormArray;
    const oneRecord = oneFormArray.controls[key] as FormGroup;
    console.log(oneRecord);
    oneRecord.controls.value.setValue(date, {
       onlyself: true
    })
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
}
