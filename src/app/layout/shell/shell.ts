import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navbar } from '../../shared/navbar/navbar';

/** Chrome for every signed-in page. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Navbar],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {}
