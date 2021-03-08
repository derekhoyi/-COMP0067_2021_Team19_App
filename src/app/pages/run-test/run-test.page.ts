import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from "@angular/forms";
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import FormJson from '../../../assets/test_form.json'
import { Variable } from '@angular/compiler/src/render3/r3_ast';

@Component({
  selector: 'app-run-test',
  templateUrl: 'run-test.page.html',
  styleUrls: ['run-test.page.scss']
})
export class RunTestPage {
  
  testForm: FormGroup;
  testFormJson = FormJson; 
  scanCode: any;

  constructor(
    private fb: FormBuilder, 
    private alertCtrl: AlertController, 
    private barcodeScanner: BarcodeScanner) { 
    console.log(this.testFormJson);
    this.testForm = this.fb.group({
      testName: new FormControl('', Validators.required),
      batchNumber: new FormControl('', Validators.required),
    });
    this.createControl(this.testFormJson);
  }

  // Create form controls
  createControl(controls){
    for (let control of controls){
      if (control.type == 'group'){
        const newGroup = new FormGroup({});
        control.children.map(child => {
          const newControl = new FormControl(); 
          
          // set validators
          if (child.required){ 
            newControl.setValidators(Validators.required);
          }
          newGroup.addControl(child.key, newControl);
        });
        this.testForm.addControl(control.key, newGroup);

      } 
      // else if (control.type == 'array'){
      //   const newArray = new FormArray([]);

      //   const oneGroup = new FormGroup({});
      //   control.children.map(child => {
      //     oneGroup.addControl(child.key, new FormControl());
      //   });
      //   newArray.push(oneGroup);
      //   this.myForm.addControl(control.key, newArray);
      // }

      // const  newFormControl = new FormControl(); 
      
      // if (control.required){
      //   newFormControl.setValidators(Validators.required);
      // }

      // this.myForm.addControl(control.key, newFormControl);
    }
    console.log('My form: ', this.testForm);
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
  getDate(e) {
    let date = new Date(e.target.value).toISOString().substring(0, 10);
    this.testForm.get('dob').setValue(date, {
       onlyself: true
    })
  }

  // QR code scanner
  scan() {
    this.scanCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scanCode = barcodeData;
    }).catch(err => {
      console.log('Error', err);
    });
  }

  scan1(key: string) {
    // console.log(key);
    // console.log(this.testForm.controls.reagents.value[key]);
    const newNestedGroup = this.testForm.get('reagents') as FormGroup;
    // console.log(this.newNestGroup);
    newNestedGroup.controls[key].patchValue('dd');
    // console.log(this.newNestGroup.controls.iqc.value);
  }

  ngOnInit() {
  } 
}
