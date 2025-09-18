import { Component, OnInit, signal, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth as AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements OnInit {
  @Input() mode: 'header' | 'login' = 'header';
  user$: Observable<User | null>;
  isLoading = false;
  isMobileMenuOpen = signal(false);

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {}

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
      event.preventDefault();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const mobileAuth = target.closest('.mobile-auth');
    
    if (!mobileAuth && this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
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
