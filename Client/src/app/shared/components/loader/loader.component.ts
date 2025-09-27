import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * @title Basic progress-spinner
 */
@Component({
  standalone: true,

  selector: 'app-loader',
  templateUrl: 'loader.component.html',
  styleUrl: 'loader.component.scss',
  imports: [MatProgressSpinnerModule],
})
export class LoaderComponent {}
