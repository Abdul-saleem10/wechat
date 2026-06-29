import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, hasConfig } from '@/lib/firebase';
import { User } from '@/types';

function requireAuth() {
  if (!hasConfig || !auth) throw new Error('Firebase is not configured. Create .env.local from .env.example.');
}

export const authService = {
  onAuthChanged(callback: (user: FirebaseUser | null) => void) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },

  async register(email: string, password: string, name: string): Promise<User> {
    requireAuth();
    const cred = await createUserWithEmailAndPassword(auth!, email, password);
    await updateProfile(cred.user, { displayName: name });
    const user: User = {
      uid: cred.user.uid,
      name,
      email,
      avatar: '',
      bio: '',
      lastSeen: serverTimestamp(),
      online: true,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db!, 'users', cred.user.uid), user);
    return user;
  },

  async login(email: string, password: string): Promise<FirebaseUser> {
    requireAuth();
    const cred = await signInWithEmailAndPassword(auth!, email, password);
    await setDoc(doc(db!, 'users', cred.user.uid), { online: true, lastSeen: serverTimestamp() }, { merge: true });
    return cred.user;
  },

  async googleSignIn(): Promise<User> {
    requireAuth();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth!, provider);
    const userDoc = await getDoc(doc(db!, 'users', cred.user.uid));
    if (!userDoc.exists()) {
      const user: User = {
        uid: cred.user.uid,
        name: cred.user.displayName || 'User',
        email: cred.user.email || '',
        avatar: cred.user.photoURL || '',
        bio: '',
        lastSeen: serverTimestamp(),
        online: true,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db!, 'users', cred.user.uid), user);
      return user;
    }
    await setDoc(doc(db!, 'users', cred.user.uid), { online: true, lastSeen: serverTimestamp() }, { merge: true });
    return { ...userDoc.data() as User, uid: cred.user.uid };
  },

  async logout(): Promise<void> {
    requireAuth();
    const user = auth!.currentUser;
    if (user) {
      await setDoc(doc(db!, 'users', user.uid), { online: false, lastSeen: serverTimestamp() }, { merge: true });
    }
    await signOut(auth!);
  },

  async getUserData(uid: string): Promise<User | null> {
    if (!hasConfig || !db) return null;
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? { ...docSnap.data() as User, uid: docSnap.id } : null;
  },

  getCurrentUser(): FirebaseUser | null {
    return auth?.currentUser ?? null;
  },
};
