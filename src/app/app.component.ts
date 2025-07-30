import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatButtonModule, MatInputModule, MatSelectModule, NgFor,MatTabsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  foods = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
  servers = [
    {
      ServerID:1,
      ServerDesc:'Dev',
    },
    {
      ServerID:2,
      ServerDesc:'Alpha',
    },
  ]
}
