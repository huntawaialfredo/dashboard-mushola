import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  writeBatch,
  query,
  orderBy,
  getDocFromServer,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { CashTransaction } from '../types';

// Read configuration values direct matching the generated credentials
const firebaseConfig = {
  apiKey: "AIzaSyDVnDXEEgBKpBzm61lLOV6NBWewCG2CY5o",
  authDomain: "potent-hexagon-4ln7n.firebaseapp.com",
  projectId: "potent-hexagon-4ln7n",
  storageBucket: "potent-hexagon-4ln7n.firebasestorage.app",
  messagingSenderId: "372201025565",
  appId: "1:372201025565:web:f6854a0276096b36c396f4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-04cb58ef-ac37-42c4-beff-2b089480a785");

// Validate connection to Firestore as required by system guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection response received successfully");
    return true;
  } catch (error) {
    console.error("Firebase connection check:", error);
    return false;
  }
}

// Fetch all transactions sorted by the true numerical sequence 'no'
export async function getTransactionsFromDb(): Promise<CashTransaction[]> {
  try {
    const q = query(collection(db, 'transactions'), orderBy('no', 'asc'));
    const snapshot = await getDocs(q);
    const list: CashTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CashTransaction);
    });
    return list;
  } catch (error: any) {
    console.error("Error fetching transactions from Firestore:", error);
    throw new Error(JSON.stringify({
      operation: 'list',
      collection: 'transactions',
      message: error.message || "Failed to list transactions"
    }));
  }
}

// Helper to clean undefined values recursively from objects before committing to Firestore
function cleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = cleanUndefined(val);
    }
  });
  return clean;
}

// Atomic full replace sync to prevent leftover "shadow/orphan record" bugs 
// when items are deleted, shifted or re-indexed chronologically.
export async function syncTransactionsToDb(transactions: CashTransaction[]): Promise<void> {
  try {
    // 1. Fetch current transaction document keys
    const q = collection(db, 'transactions');
    const snapshot = await getDocs(q);
    
    // 2. Perform deletions and writes in a single atomic batch
    const batch = writeBatch(db);
    
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    // Sort transactions prior to database commit
    const parseDate = (dStr: string) => {
      const p = dStr.split('/');
      if (p.length === 3) {
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      }
      return 0;
    };
    
    const sortedList = [...transactions].sort((a, b) => parseDate(a.tanggal) - parseDate(b.tanggal));
    
    let runningSaldo = 0;
    sortedList.forEach((tx, idx) => {
      const pem = tx.pemasukan || 0;
      const pen = tx.pengeluaran || 0;
      runningSaldo = runningSaldo + pem - pen;
      
      const updatedTx: CashTransaction = {
        ...tx,
        no: idx + 1,
        saldo: runningSaldo
      };
      
      const docRef = doc(db, 'transactions', `tx_${updatedTx.no}`);
      batch.set(docRef, cleanUndefined(updatedTx));
    });
    
    await batch.commit();
  } catch (error: any) {
    console.error("Error writing active state to database:", error);
    throw new Error(JSON.stringify({
      operation: 'write',
      collection: 'transactions',
      message: error.message || "Failed to sync transactions"
    }));
  }
}

export interface RegisteredUser {
  username: string;
  role: 'admin' | 'user';
  name: string;
  password?: string;
}

// Fetch all registered users from Firestore, auto-seeding defaults if empty
export async function getUsersFromDb(): Promise<RegisteredUser[]> {
  try {
    const ref = collection(db, 'users');
    const snapshot = await getDocs(ref);
    const list: RegisteredUser[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as RegisteredUser);
    });
    
    if (list.length === 0) {
      const batch = writeBatch(db);
      const defaults: RegisteredUser[] = [
        { username: 'admin', role: 'admin', name: 'Administrator Al-Falah', password: 'admin123' },
        { username: 'tamu', role: 'user', name: 'Tamu / Umum', password: 'user123' },
        { username: 'user', role: 'user', name: 'Tamu / Umum', password: 'user123' }
      ];
      
      defaults.forEach((u) => {
        const docRef = doc(db, 'users', u.username);
        batch.set(docRef, u);
      });
      await batch.commit();
      return defaults;
    }
    
    return list;
  } catch (error: any) {
    console.error("Error fetching users from Firestore:", error);
    // If it fails (e.g. offline or no database yet), return fallback local defaults
    return [
      { username: 'admin', role: 'admin', name: 'Administrator Al-Falah', password: 'admin123' },
      { username: 'tamu', role: 'user', name: 'Tamu / Umum', password: 'user123' },
      { username: 'user', role: 'user', name: 'Tamu / Umum', password: 'user123' }
    ];
  }
}

// Save/update a user in Firestore
export async function saveUserToDb(user: RegisteredUser): Promise<void> {
  try {
    const docRef = doc(db, 'users', user.username.trim().toLowerCase());
    await setDoc(docRef, cleanUndefined(user));
  } catch (error: any) {
    console.error("Error saving user to Firestore:", error);
    throw new Error(JSON.stringify({
      operation: 'write',
      collection: 'users',
      message: error.message || "Failed to save user"
    }));
  }
}

// Delete user from Firestore
export async function deleteUserFromDb(username: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', username.trim().toLowerCase());
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error("Error deleting user from Firestore:", error);
    throw new Error(JSON.stringify({
      operation: 'delete',
      collection: 'users',
      message: error.message || "Failed to delete user"
    }));
  }
}
