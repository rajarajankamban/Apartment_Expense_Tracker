import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// --- DATA INTERFACES ---
export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

export type NewTransaction = Omit<Transaction, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  // This should point to your Vercel serverless function endpoint
  private apiUrl = '/api/transactions'; 

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    // Provide a more user-friendly error message
    return throwError(() => new Error('An error occurred while communicating with the server. Please try again later.'));
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  addTransaction(transaction: NewTransaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction).pipe(
      catchError(this.handleError)
    );
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}
