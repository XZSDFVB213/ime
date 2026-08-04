import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  login() {
    this.auth
      .login({
        email: this.email,
        password: this.password,
      })
      .subscribe((res) => {
        console.log(res);

        localStorage.setItem('accessToken', res.accessToken);

        this.router.navigate(['/teacher/dashboard']);
      });
  }
}
