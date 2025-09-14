import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth as AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth implements OnInit {
  user$: Observable<User | null>;
  isLoading = false;
  isMobileMenuOpen = signal(false);

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async signOut(): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.signOut();
      this.closeMobileMenu(); // Close menu after sign out
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
