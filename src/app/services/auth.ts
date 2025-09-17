import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private firebasePromise: Promise<any> | null = null;
  private authInitialized = false;
  private app: any = null;
  private auth: any = null;
  private provider: any = null;
  private userSubject = new BehaviorSubject<any | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Firebase will be initialized lazily when needed
  }

  /**
   * Lazy load Firebase modules
   */
  private async initializeFirebase(): Promise<void> {
    if (this.authInitialized) return;

    if (!this.firebasePromise) {
      this.firebasePromise = Promise.all([
        import('firebase/app'),
        import('firebase/auth')
      ]);
    }

    try {
      const [{ initializeApp }, { getAuth, GoogleAuthProvider, onAuthStateChanged }] = await this.firebasePromise;
      
      this.app = initializeApp(environment.firebase);
      this.auth = getAuth(this.app);
      this.provider = new GoogleAuthProvider();
      
      onAuthStateChanged(this.auth, (user: any) => {
        this.userSubject.next(user);
      });

      this.authInitialized = true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<any | null> {
    try {
      await this.initializeFirebase();
      const { signInWithPopup } = await import('firebase/auth');
      const result = await signInWithPopup(this.auth, this.provider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.initializeFirebase();
      const { signOut } = await import('firebase/auth');
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  getCurrentUser(): any | null {
    return this.auth?.currentUser || null;
  }
}
