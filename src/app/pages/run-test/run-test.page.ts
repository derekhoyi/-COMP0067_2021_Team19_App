import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from "@angular/forms";

@Component({
  selector: 'app-run-test',
  templateUrl: 'run-test.page.html',
  styleUrls: ['run-test.page.scss']
})
export class RunTestPage {
  
  // declear form group
  testForm: FormGroup;
  defaultDate = "1987-06-30";
  equipment: FormArray;
  // reagents: FormArray;
  
  constructor(public formBuilder: FormBuilder) {}

  ngOnInit() {
    this.testForm = this.formBuilder.group({
      batchNumber: [''],
      dob: [''],
      mobile: [''],
      // equipment: this.formBuilder.array([''])
      equipment: this.formBuilder.array([this.createEqpt()])
      // reagents: this.formBuilder.array([this.createEqpt()])
    })
  }

  // Reagents
  // createReagent(): FormGroup {
  //   return this.formBuilder.group({
  //     pipette: ''
  //   });
  // }

  // Equipment
  createEqpt(): FormGroup {
    return this.formBuilder.group({
      pipette: ''
    });
  }
  addEqpt(): void {
    this.equipment = this.testForm.get('equipment') as FormArray;
    this.equipment.push(this.createEqpt());
  }
  
  // addEqpt(): void {
  //   this.equipment = this.testForm.get('equipment') as FormArray;
  //   this.equipment.push(this.formBuilder.control(''));
  // }

  removeEqpt(index){
    this.equipment.removeAt(index)
  };

  // Format date
  getDate(e) {
    let date = new Date(e.target.value).toISOString().substring(0, 10);
    this.testForm.get('dob').setValue(date, {
       onlyself: true
    })
 }

  // Submit form
  submitForm() {
  console.log(this.testForm.value)
  // console.log(this.testForm.value.equipment[0])
}

}
