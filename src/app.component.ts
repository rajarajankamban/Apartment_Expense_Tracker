import { Component, ChangeDetectionStrategy, signal, computed, WritableSignal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Transaction, NewTransaction, TransactionService } from './transaction.service';

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
          <div class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md sm:block flex items-center justify-between">
            <h2 class="text-base sm:text-lg font-semibold text-zinc-500 sm:mb-2">Total Credit ({{ formatMonth(selectedMonth()) }})</h2>
            <p class="text-xl sm:text-3xl font-bold text-green-600">{{ totalCredit() | currency:'INR' }}</p>
          </div>
          <div class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md sm:block flex items-center justify-between">
            <h2 class="text-base sm:text-lg font-semibold text-zinc-500 sm:mb-2">Total Debit ({{ formatMonth(selectedMonth()) }})</h2>
            <p class="text-xl sm:text-3xl font-bold text-red-600">{{ totalDebit() | currency:'INR' }}</p>
          </div>
          <div class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md sm:block flex items-center justify-between">
            <h2 class="text-base sm:text-lg font-semibold text-zinc-500 sm:mb-2">Balance ({{ formatMonth(selectedMonth()) }})</h2>
            <p class="text-xl sm:text-3xl font-bold" [class.text-blue-600]="balance() >= 0" [class.text-red-600]="balance() < 0">
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
                  <label for="date" class="block text-base font-medium text-zinc-600">Date</label>
                  <div class="relative mt-1">
                    <input #dateInput id="date" type="date" formControlName="date" class="text-base appearance-none block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2 pr-10">
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" (click)="dateInput.showPicker()">
                       <svg class="h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                       </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label for="description" class="block text-base font-medium text-zinc-600">Description</label>
                  <input id="description" type="text" formControlName="description" placeholder="e.g., Monthly Rent" class="text-base mt-1 block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2">
                </div>
                <div>
                  <label for="amount" class="block text-base font-medium text-zinc-600">Amount</label>
                  <input id="amount" type="number" formControlName="amount" placeholder="0.00" class="text-base mt-1 block w-full bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2">
                </div>
                <div>
                  <label class="block text-base font-medium text-zinc-600">Type</label>
                  <div class="mt-2 grid grid-cols-2 gap-3">
                    <button type="button" (click)="transactionForm.controls['type'].setValue('credit')" 
                            [class.bg-green-500]="transactionForm.value.type === 'credit'" 
                            [class.text-white]="transactionForm.value.type === 'credit'"
                            [class.bg-zinc-200]="transactionForm.value.type !== 'credit'"
                            class="w-full text-base font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-green-400/50">
                      Credit
                    </button>
                    <button type="button" (click)="transactionForm.controls['type'].setValue('debit')" 
                            [class.bg-red-500]="transactionForm.value.type === 'debit'"
                            [class.text-white]="transactionForm.value.type === 'debit'"
                            [class.bg-zinc-200]="transactionForm.value.type !== 'debit'"
                            class="w-full text-base font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-red-400/50">
                      Debit
                    </button>
                  </div>
                </div>
                <button type="submit" [disabled]="transactionForm.invalid" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200">
                  Add Transaction
                </button>
              </form>
            </section>

            <!-- Actions: Export -->
            <section class="bg-white p-6 rounded-2xl border border-zinc-200 shadow-md">
              <h2 class="text-2xl font-bold text-zinc-900 mb-4">Export Data</h2>
              <div class="flex flex-col sm:flex-row gap-4">
                <button (click)="exportCSV()" class="flex-1 bg-teal-600 text-white font-bold py-3 px-4 rounded-md hover:bg-teal-700 transition-colors duration-200">Export as CSV</button>
                <button (click)="exportPDF()" [disabled]="isPdfLoading()" class="flex-1 bg-purple-600 text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-wait transition-colors duration-200">
                  @if (isPdfLoading()) {
                    <span>Generating PDF...</span>
                  } @else {
                    <span>Export as PDF</span>
                  }
                </button>
              </div>
            </section>
          </div>
          
          <!-- Right Column: Transaction List -->
          <div class="lg:col-span-3">
            <section class="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 class="text-2xl font-bold text-zinc-900">History</h2>
                  @if (availableMonths().length > 0) {
                    <div class="mt-2 sm:mt-0">
                      <label for="month-select" class="sr-only">Select Month</label>
                      <select id="month-select" [value]="selectedMonth()" (change)="onMonthChange($event)" class="w-full sm:w-auto text-base bg-zinc-100 border-zinc-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-zinc-800 p-2">
                        @for (month of availableMonths(); track month) {
                          <option [value]="month">{{ formatMonth(month) }}</option>
                        }
                      </select>
                    </div>
                  }
              </div>

              @if (isLoading()) {
                <div class="text-center py-10">
                  <p class="text-zinc-500">Loading transactions...</p>
                  <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              } @else if (filteredAndSortedTransactions().length === 0) {
                <div class="text-center py-10">
                  <p class="text-zinc-500">No transactions found for {{ formatMonth(selectedMonth()) }}.</p>
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
                      @for (tx of filteredAndSortedTransactions(); track tx.id) {
                        <tr class="border-b border-zinc-200 hover:bg-zinc-50">
                          <td class="p-4">{{ formatDateForDisplay(tx.date) }}</td>
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
                  @for (tx of filteredAndSortedTransactions(); track tx.id) {
                    <div class="bg-zinc-100 p-4 rounded-lg flex justify-between items-center">
                      <div class="flex-1">
                        <p class="font-semibold">{{ tx.description }}</p>
                        <p class="text-sm text-zinc-500">{{ formatDateForDisplay(tx.date) }}</p>
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
export class AppComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private fb = inject(FormBuilder);

  transactions: WritableSignal<Transaction[]> = signal([]);
  isLoading = signal(true);
  selectedMonth = signal<string>('');
  
  transactionForm: FormGroup;
  isPdfLoading = signal(false);

  // --- DERIVED STATE FROM SIGNALS ---
  
  availableMonths = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = new Set(this.transactions().map(t => t.date.slice(0, 7)));
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  });

  filteredTransactions = computed(() => {
    const month = this.selectedMonth();
    if (!month) return [];
    return this.transactions().filter(t => t.date.startsWith(month));
  });

  totalCredit = computed(() => this.filteredTransactions()
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)
  );
  
  totalDebit = computed(() => this.filteredTransactions()
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)
  );
  
  balance = computed(() => this.totalCredit() - this.totalDebit());
  
  filteredAndSortedTransactions = computed(() => 
    [...this.filteredTransactions()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  constructor() {
    this.transactionForm = this.fb.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['debit' as 'credit' | 'debit', Validators.required]
    });
    
    this.selectedMonth.set(new Date().toISOString().slice(0, 7));
  }
  
  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        alert('Could not load transaction data from the server.');
        this.isLoading.set(false);
      }
    });
  }

  addTransaction(): void {
    if (this.transactionForm.invalid) return;
    const newTransactionData: NewTransaction = this.transactionForm.value;
    this.transactionService.addTransaction(newTransactionData).subscribe({
      next: (addedTransaction) => {
        this.transactions.update(current => [...current, addedTransaction]);
        const transactionMonth = addedTransaction.date.slice(0, 7);
        if (this.selectedMonth() !== transactionMonth) {
            this.selectedMonth.set(transactionMonth);
        }
        this.transactionForm.reset({
          date: new Date().toISOString().substring(0, 10),
          description: '',
          amount: null,
          type: 'debit'
        });
      },
      error: (err) => {
        console.error('Failed to add transaction:', err);
        alert('Could not save the new transaction.');
      }
    });
  }

  deleteTransaction(id: number): void {
    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions.update(current => current.filter(t => t.id !== id));
      },
      error: (err) => {
        console.error('Failed to delete transaction:', err);
        alert('Could not delete the transaction.');
      }
    });
  }

  onMonthChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedMonth.set(selectElement.value);
  }

  exportCSV(): void {
    const headers = ['id', 'date', 'description', 'amount', 'type'];
    const rows = this.filteredAndSortedTransactions().map(tx => 
      [tx.id, this.formatDateForDisplay(tx.date), this.escapeCsvField(tx.description), tx.amount, tx.type].join(',')
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
        let finalY = 0;

        // --- STYLING & FORMATTERS ---
        const HEADER_COLOR = '#0F172A';
        const CREDIT_HEADER_COLOR = '#166534';
        const DEBIT_HEADER_COLOR = '#991B1B';
        const CONSOLIDATED_HEADER_COLOR = '#1E40AF';
        const CREDIT_COLOR = '#15803d';
        const DEBIT_COLOR = '#b91c1c';
        const TEXT_COLOR = '#1e293b';
        const SUBTLE_TEXT_COLOR = '#64748b';
        const BORDER_COLOR = '#e2e8f0';
        const pageMargin = 14;

        const formatAsINR = (amount: number) => `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const generatedDate = new Date().toLocaleDateString('en-GB');

        // --- PDF HEADER ---
        doc.setFillColor(HEADER_COLOR);
        doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
        doc.setFontSize(18);
        doc.setTextColor('#FFFFFF');
        doc.setFont('helvetica', 'bold');
        doc.text('Apartment Expense Report', pageMargin, 18);
        
        // --- SUMMARY SECTION ---
        finalY = 40;
        doc.setFontSize(10);
        doc.setTextColor(SUBTLE_TEXT_COLOR);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Credit', pageMargin, finalY);
        doc.text('Total Debit', 80, finalY);
        doc.text('Current Balance', 145, finalY);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(CREDIT_COLOR);
        doc.text(formatAsINR(this.totalCredit()), pageMargin, finalY + 7);
        doc.setTextColor(DEBIT_COLOR);
        doc.text(formatAsINR(this.totalDebit()), 80, finalY + 7);
        doc.setTextColor(this.balance() >= 0 ? CONSOLIDATED_HEADER_COLOR : DEBIT_COLOR);
        doc.text(formatAsINR(this.balance()), 145, finalY + 7);
        
        finalY += 15;
        doc.setDrawColor(BORDER_COLOR);
        doc.line(pageMargin, finalY, doc.internal.pageSize.width - pageMargin, finalY);
        finalY += 12;
        
        const transactionsForPDF = this.filteredAndSortedTransactions();
        const creditTransactions = transactionsForPDF.filter(tx => tx.type === 'credit');
        const debitTransactions = transactionsForPDF.filter(tx => tx.type === 'debit');

        const autoTableConfig = {
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2.5 },
            margin: { left: pageMargin, right: pageMargin },
            didDrawPage: (data: any) => {
                const pageHeight = doc.internal.pageSize.height;
                doc.setFontSize(8);
                doc.setTextColor(SUBTLE_TEXT_COLOR);
                doc.text(`Report for ${this.formatMonth(this.selectedMonth())} | Generated on ${generatedDate}`, pageMargin, pageHeight - 10);
                doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - pageMargin, pageHeight - 10, { align: 'right' });
            }
        };

        if (transactionsForPDF.length === 0) {
            doc.text(`No transactions to report for ${this.formatMonth(this.selectedMonth())}.`, pageMargin, finalY);
        } else {
            // --- CREDIT TRANSACTIONS TABLE ---
            if (creditTransactions.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(TEXT_COLOR);
                doc.setFont('helvetica', 'bold');
                doc.text('Credit Transactions', pageMargin, finalY);
                finalY += 6;

                (doc as any).autoTable({
                    ...autoTableConfig,
                    head: [['Date', 'Description', 'Amount']],
                    body: creditTransactions.map(tx => [this.formatDateForDisplay(tx.date), tx.description, formatAsINR(tx.amount)]),
                    startY: finalY,
                    headStyles: { fillColor: CREDIT_HEADER_COLOR, textColor: '#FFFFFF' },
                    columnStyles: { 2: { halign: 'right' } },
                    didDrawCell: (data: any) => {
                        if (data.section === 'body' && data.column.index === 2) doc.setTextColor(CREDIT_COLOR);
                    },
                });
                finalY = (doc as any).lastAutoTable.finalY + 12;
            }
            
            // --- DEBIT TRANSACTIONS TABLE ---
            if (debitTransactions.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(TEXT_COLOR);
                doc.setFont('helvetica', 'bold');
                doc.text('Debit Transactions', pageMargin, finalY);
                finalY += 6;
                
                (doc as any).autoTable({
                    ...autoTableConfig,
                    head: [['Date', 'Description', 'Amount']],
                    body: debitTransactions.map(tx => [this.formatDateForDisplay(tx.date), tx.description, formatAsINR(tx.amount)]),
                    startY: finalY,
                    headStyles: { fillColor: DEBIT_HEADER_COLOR, textColor: '#FFFFFF' },
                    columnStyles: { 2: { halign: 'right' } },
                    didDrawCell: (data: any) => {
                        if (data.section === 'body' && data.column.index === 2) doc.setTextColor(DEBIT_COLOR);
                    },
                });
                finalY = (doc as any).lastAutoTable.finalY + 12;
            }

            // --- CONSOLIDATED TRANSACTION HISTORY ---
            doc.setFontSize(14);
            doc.setTextColor(TEXT_COLOR);
            doc.setFont('helvetica', 'bold');
            doc.text('Consolidated Transaction History', pageMargin, finalY);
            finalY += 6;

            (doc as any).autoTable({
                ...autoTableConfig,
                head: [['Date', 'Description', 'Type', 'Amount']],
                body: transactionsForPDF.map(tx => [
                    this.formatDateForDisplay(tx.date),
                    tx.description,
                    tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
                    `${tx.type === 'credit' ? '+' : '-'} ${formatAsINR(tx.amount)}`
                ]),
                startY: finalY,
                headStyles: { fillColor: CONSOLIDATED_HEADER_COLOR, textColor: '#FFFFFF' },
                columnStyles: { 3: { halign: 'right' } },
                didDrawCell: (data: any) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        const text = String(data.cell.raw);
                        doc.setTextColor(text.trim().startsWith('+') ? CREDIT_COLOR : DEBIT_COLOR);
                    }
                },
            });
        }
        
        doc.save(this.getExportFilename('pdf'));
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        alert('Could not generate PDF. Please try again.');
    } finally {
        this.isPdfLoading.set(false);
    }
  }

  // --- HELPERS ---
  formatMonth(yyyyMM: string): string {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    // Handles both 'YYYY-MM-DD' and ISO strings by taking the first 10 characters
    const datePart = dateString.substring(0, 10);
    const [year, month, day] = datePart.split('-');
    if (year && month && day && year.length === 4) {
        return `${day}-${month}-${year}`;
    }
    return dateString; // Fallback to original string if format is unexpected
  }

  private getExportFilename(extension: 'csv' | 'pdf'): string {
    const monthStr = this.selectedMonth().replace('-', '_');
    return `transactions_${monthStr}.${extension}`;
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
