import { Component, ChangeDetectionStrategy, signal, computed, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// --- DATA INTERFACE ---
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-zinc-100 text-zinc-900 font-sans p-4 sm:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <header class="mb-8 text-center">
          <h1 class="text-4xl sm:text-5xl font-extrabold text-zinc-900 mb-2">Apartment Expense Tracker</h1>
          <p class="text-zinc-500">Manage your maintenance finances with ease.</p>
        </header>

        <!-- Summary Cards -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md">
            <h2 class="text-lg font-semibold text-zinc-500 mb-2">Total Credit</h2>
            <p class="text-3xl font-bold text-green-600">{{ totalCredit() | currency:'INR' }}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md">
            <h2 class="text-lg font-semibold text-zinc-500 mb-2">Total Debit</h2>
            <p class="text-3xl font-bold text-red-600">{{ totalDebit() | currency:'INR' }}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md">
            <h2 class="text-lg font-semibold text-zinc-500 mb-2">Current Balance</h2>
            <p class="text-3xl font-bold" [class.text-blue-600]="balance() >= 0" [class.text-red-600]="balance() < 0">
              {{ balance() | currency:'INR' }}
            </p>
          </div>
        </section>

        <!-- Main Content Area -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <!-- Left Column: Form & Actions -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Add Transaction Form -->
            <section class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md">
              <h2 class="text-2xl font-bold text-zinc-900 mb-4">New Transaction</h2>
              <form [formGroup]="transactionForm" (ngSubmit)="addTransaction()" class="space-y-4">
                <div>
                  <label for="date" class="block text-sm font-medium text-zinc-600">Date</label>
                  <div class="relative mt-1">
                    <input id="date" type="date" formControlName="date" class="appearance-none block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2 pr-10">
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                       <svg class="h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                       </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label for="description" class="block text-sm font-medium text-zinc-600">Description</label>
                  <input id="description" type="text" formControlName="description" placeholder="e.g., Monthly Rent" class="mt-1 block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2">
                </div>
                <div>
                  <label for="amount" class="block text-sm font-medium text-zinc-600">Amount</label>
                  <input id="amount" type="number" formControlName="amount" placeholder="0.00" class="mt-1 block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2">
                </div>
                <div>
                  <label class="block text-sm font-medium text-zinc-600">Type</label>
                  <div class="mt-2 grid grid-cols-2 gap-3">
                    <button type="button" (click)="transactionForm.controls['type'].setValue('credit')" 
                            [class.bg-green-500]="transactionForm.value.type === 'credit'" 
                            [class.text-white]="transactionForm.value.type === 'credit'"
                            [class.bg-zinc-200]="transactionForm.value.type !== 'credit'"
                            class="w-full font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-green-400/50">
                      Credit
                    </button>
                    <button type="button" (click)="transactionForm.controls['type'].setValue('debit')" 
                            [class.bg-red-500]="transactionForm.value.type === 'debit'"
                            [class.text-white]="transactionForm.value.type === 'debit'"
                            [class.bg-zinc-200]="transactionForm.value.type !== 'debit'"
                            class="w-full font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-red-400/50">
                      Debit
                    </button>
                  </div>
                </div>
                <button type="submit" [disabled]="transactionForm.invalid" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200">
                  Add Transaction
                </button>
              </form>
            </section>

            <!-- Actions: Import/Export -->
            <section class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md flex flex-col">
              <h2 class="text-2xl font-bold text-zinc-900 mb-4">Data Management</h2>
              <div class="flex flex-col sm:flex-row gap-4 mb-4">
                <button (click)="exportCSV()" class="flex-1 bg-teal-600 text-white font-bold py-3 px-4 rounded-md hover:bg-teal-700 transition-colors duration-200">Export as CSV</button>
                <button (click)="exportPDF()" [disabled]="isPdfLoading()" class="flex-1 bg-purple-600 text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-wait transition-colors duration-200">
                  @if (isPdfLoading()) {
                    <span>Generating PDF...</span>
                  } @else {
                    <span>Export as PDF</span>
                  }
                </button>
              </div>
              <div class="flex-1 border-2 border-dashed border-zinc-300 rounded-md p-4 flex flex-col items-center justify-center">
                <label for="csv-import" class="w-full cursor-pointer bg-zinc-600 text-white font-bold py-3 px-4 rounded-md hover:bg-zinc-700 transition-colors duration-200 text-center">
                  Import from CSV (Replace)
                </label>
                <input id="csv-import" type="file" (change)="onFileSelected($event)" accept=".csv" class="hidden">
                <p class="text-sm text-zinc-500 mt-2">This will replace all current data.</p>
              </div>
            </section>
          </div>
          
          <!-- Right Column: Transaction List -->
          <div class="lg:col-span-3">
            <section class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md">
              <h2 class="text-2xl font-bold text-zinc-900 mb-4">History</h2>
              @if (sortedTransactions().length === 0) {
                <div class="text-center py-10">
                  <p class="text-zinc-500">No transactions yet. Add one to get started!</p>
                </div>
              } @else {
                <!-- Desktop Table View -->
                <div class="hidden md:block">
                  <table class="w-full text-left">
                    <thead class="border-b-2 border-zinc-200">
                      <tr>
                        <th class="p-4 text-sm font-semibold text-zinc-500">Date</th>
                        <th class="p-4 text-sm font-semibold text-zinc-500">Description</th>
                        <th class="p-4 text-sm font-semibold text-zinc-500 text-right">Amount</th>
                        <th class="p-4 text-sm font-semibold text-zinc-500 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tx of sortedTransactions(); track tx.id) {
                        <tr class="border-b border-zinc-200 hover:bg-zinc-50">
                          <td class="p-4">{{ tx.date }}</td>
                          <td class="p-4">{{ tx.description }}</td>
                          <td class="p-4 text-right font-mono" [class.text-green-600]="tx.type === 'credit'" [class.text-red-600]="tx.type === 'debit'">
                            {{ (tx.type === 'credit' ? '+' : '-') }} {{ tx.amount | currency:'INR' }}
                          </td>
                          <td class="p-4 text-center">
                            <button (click)="deleteTransaction(tx.id)" class="text-zinc-400 hover:text-red-500 transition-colors duration-200">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Mobile Card View -->
                <div class="md:hidden space-y-3">
                  @for (tx of sortedTransactions(); track tx.id) {
                    <div class="bg-zinc-100 p-4 rounded-lg flex justify-between items-center">
                      <div class="flex-1">
                        <p class="font-semibold">{{ tx.description }}</p>
                        <p class="text-sm text-zinc-500">{{ tx.date }}</p>
                      </div>
                      <div class="text-right ml-4">
                        <p class="font-bold text-lg" [class.text-green-600]="tx.type === 'credit'" [class.text-red-600]="tx.type === 'debit'">
                          {{ (tx.type === 'credit' ? '+' : '-') }} {{ tx.amount | currency:'INR' }}
                        </p>
                      </div>
                       <button (click)="deleteTransaction(tx.id)" class="text-zinc-400 hover:text-red-500 transition-colors duration-200 ml-4">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>
                  }
                </div>
              }
            </section>
          </div>

        </div>

      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly STORAGE_KEY = 'apartmentExpenses';
  transactions: WritableSignal<Transaction[]> = signal([]);
  
  transactionForm: FormGroup;
  isPdfLoading = signal(false);

  // --- COMPUTED SIGNALS for reactive calculations ---
  totalCredit = computed(() => this.transactions()
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)
  );
  
  totalDebit = computed(() => this.transactions()
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
  );
  
  balance = computed(() => this.totalCredit() - this.totalDebit());
  
  sortedTransactions = computed(() => 
    [...this.transactions()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  constructor(private fb: FormBuilder) {
    this.transactionForm = this.fb.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['debit' as 'credit' | 'debit', Validators.required]
    });
    
    this.loadFromLocalStorage();

    // Effect to automatically save to localStorage on change
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.transactions()));
    });
  }

  // --- CRUD OPERATIONS ---
  addTransaction(): void {
    if (this.transactionForm.invalid) return;

    const newTransaction: Transaction = {
      id: Date.now(),
      ...this.transactionForm.value
    };

    this.transactions.update(current => [...current, newTransaction]);
    this.transactionForm.reset({
      date: new Date().toISOString().substring(0, 10),
      description: '',
      amount: null,
      type: 'debit'
    });
  }

  deleteTransaction(id: number): void {
    this.transactions.update(current => current.filter(t => t.id !== id));
  }

  // --- LOCAL STORAGE ---
  private loadFromLocalStorage(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (savedData) {
      this.transactions.set(JSON.parse(savedData));
    }
  }

  // --- DATA EXPORT ---
  exportCSV(): void {
    const headers = ['id', 'date', 'description', 'amount', 'type'];
    const rows = this.sortedTransactions().map(tx => 
      [tx.id, tx.date, this.escapeCsvField(tx.description), tx.amount, tx.type].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    this.downloadFile(csvContent, 'text/csv', this.getExportFilename('csv'));
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  async exportPDF(): Promise<void> {
    this.isPdfLoading.set(true);
    try {
      await this.loadJsPDF();
      
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();

      // Helper for number formatting to avoid font issues with '₹'
      const formatAsINR = (amount: number) => `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      doc.setFontSize(22);
      doc.text('Apartment Expense Report', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Total Credit: ${formatAsINR(this.totalCredit())}`, 14, 30);
      doc.text(`Total Debit: ${formatAsINR(this.totalDebit())}`, 14, 36);
      doc.text(`Current Balance: ${formatAsINR(this.balance())}`, 14, 42);

      const head = [['Date', 'Description', 'Type', 'Amount']];
      const body = this.sortedTransactions().map(tx => [
        tx.date,
        tx.description,
        tx.type,
        `${tx.type === 'credit' ? '+' : '-'} ${formatAsINR(tx.amount)}`
      ]);
      
      (doc as any).autoTable({
        head: head,
        body: body,
        startY: 50,
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
        didDrawCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 3) {
            const text = data.cell.raw as string;
            // Check for the sign, not the currency symbol
            doc.setTextColor(text.trim().startsWith('+') ? '#16a34a' : '#dc2626'); // green-600 / red-600
          }
        },
      });
      
      doc.save(this.getExportFilename('pdf'));
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Could not generate PDF. Please try again.');
    } finally {
      this.isPdfLoading.set(false);
    }
  }

  // --- DATA IMPORT ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseAndImportCSV(text);
    };
    
    reader.readAsText(file);
    input.value = ''; // Reset input so same file can be selected again
  }
  
  private parseAndImportCSV(csvText: string): void {
    try {
      const lines = csvText.split('\n');
      if (lines.length < 1) {
          throw new Error("CSV file is empty or invalid.");
      }
      const headers = lines[0].trim().toLowerCase().split(',');
      const requiredHeaders = ['date', 'description', 'amount', 'type'];
      if (!requiredHeaders.every(h => headers.includes(h))) {
        throw new Error(`CSV must contain the following headers: ${requiredHeaders.join(', ')}`);
      }

      const importedTransactions: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV parsing that handles quoted commas
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        const transactionData: any = {};
        headers.forEach((header, index) => {
          let value = (values[index] || '').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          transactionData[header] = value;
        });

        const transaction: Transaction = {
          id: Date.now() + i,
          date: transactionData.date,
          description: transactionData.description,
          amount: parseFloat(transactionData.amount),
          type: transactionData.type.toLowerCase() === 'credit' ? 'credit' : 'debit'
        };

        if (transaction.date && transaction.description && !isNaN(transaction.amount) && transaction.amount > 0) {
          importedTransactions.push(transaction);
        }
      }
      
      this.transactions.set(importedTransactions);
      alert(`Import successful! ${importedTransactions.length} transactions have been loaded, replacing all previous data.`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert(`Failed to parse CSV file. ${error instanceof Error ? error.message : 'Please ensure it is in the correct format.'}`);
    }
  }

  // --- HELPERS ---
  private getExportFilename(extension: 'csv' | 'pdf'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `transactions_${year}-${month}.${extension}`;
  }

  private downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private loadJsPDF(): Promise<void> {
    return new Promise((resolve, reject) => {
      const win = window as any;
      if (win.jspdf && win.jspdf.jsPDF.prototype.autoTable) {
        return resolve();
      }

      const jspdfScript = document.createElement('script');
      jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdfScript.onload = () => {
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => resolve();
        autoTableScript.onerror = reject;
        document.body.appendChild(autoTableScript);
      };
      jspdfScript.onerror = reject;
      document.body.appendChild(jspdfScript);
    });
  }
}
