import { Component, OnInit} from '@angular/core';
import {Validators, FormBuilder, FormGroup, FormControl,FormArray } from '@angular/forms';


@Component({
  selector: 'app-add-reagent',
  templateUrl: 'add-reagent.page.html',
  styleUrls: ['add-reagent.page.scss']
})
export class AddReagentPage implements OnInit {
  reagentForm: FormGroup;
  constructor(private fb: FormBuilder) {}
  ngOnInit(){
    this.reagentForm = this.fb.group({
        ReagentName: [''],
        ProducerName:[''],
        DateMade:[''],
        DateExpire:[''],
        Composition: this.fb.array([]),
      });
  };
  myDate: String = new Date().toISOString();

  addComponent(){
    this.Composition.push(this.fb.control(''));
  };

  removeCurrentComponent(index){

     this.Composition.removeAt(index)

  };

  get Composition() {
    return this.reagentForm.get('Composition') as FormArray;
  }

  getDate(e) {
    let date = new Date(e.target.value).toISOString();
    this.reagentForm.get(e.target.getAttribute('formControlName')).setValue(date, {
       onlyself: true
    })
  }

  async onSubmit(){
    console.log(this.reagentForm.value)
    console.log(this.reagentForm.value.Composition)
    const alert = await this.alertCtrl.create({
      header: 'Your Form',
      message: JSON.stringify(this.reagentForm.value),
      buttons: ['OK']
    });

    await alert.present();
    }
}
