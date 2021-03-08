import { JSDocTagName } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from "@angular/forms";
import { AlertController } from '@ionic/angular';
import FormJson from '../../../assets/test_form.json'

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {

  myForm: FormGroup;
  simpleForm = FormJson; 

  constructor(private fb: FormBuilder, private alertCtrl: AlertController) { 
    console.log(this.simpleForm);
    this.myForm = this.fb.group({});
    this.createControl(this.simpleForm);
  }
    
  createControl(controls){
    for (let control of controls){
      if (control.type == 'group'){
        const newGroup = new FormGroup({});
        control.children.map(child => {
          const newControl = new FormControl();
          newGroup.addControl(child.key, newControl);
        });
        this.myForm.addControl(control.key, newGroup);

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
    console.log('My form: ', this.myForm);
  }

  // getFormArray(key){
  //     return <FormArray>this.myForm.controls[key];
  // }

  async submitForm(){
    const alert = await this.alertCtrl.create({
      header: 'Your Form',
      message: JSON.stringify(this.myForm.value),
      buttons: ['OK']
    });

    await alert.present();
    console.log(this.myForm.value);
  }

  ngOnInit() {
  }

}
