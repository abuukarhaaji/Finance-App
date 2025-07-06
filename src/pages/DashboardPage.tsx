import React, { useState, useEffect } from 'react';
import { TransactionList } from '../components/Finance/TransactionList';
import { useFinance } from '../contexts/FinanceContext';
import { SpendingSummary } from '../types';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { 
  CalendarDaysIcon, 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { transactions, getSpendingSummary } = useFinance();
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    updateDataForPeriod();
  }, [selectedPeriod, customStartDate, customEndDate, transactions]);

  const updateDataForPeriod = async () => {
    let startDate: Date;
    let endDate: Date = new Date();

    switch (selectedPeriod) {
      case 'this-month':
        startDate = startOfMonth(new Date());
        break;
      case 'last-7-days':
        startDate = subDays(new Date(), 7);
        break;
      case 'last-2-days':
        startDate = subDays(new Date(), 2);
        break;
      case 'yesterday':
        startDate = subDays(new Date(), 1);
        endDate = subDays(new Date(), 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          return;
        }
        break;
      default:
        startDate = startOfMonth(new Date());
    }

    // Filter transactions
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    setFilteredTransactions(filtered);

    // Get spending summary
    const summary = await getSpendingSummary(
      startDate.toISOString(),
      endDate.toISOString()
    );
    setSpendingSummary(summary);
  };

  const exportToExcel = () => {
    // Separate deposits and expenses
    const deposits = filteredTransactions.filter(t => t.type === 'deposit');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    // Calculate totals
    const totalDeposits = deposits.reduce((sum, t) => sum + t.total_cost, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.total_cost, 0);
    const balance = totalDeposits - totalExpenses;

    // Create the data array with the requested structure
    const data = [];

    // Add deposits section
    if (deposits.length > 0) {
      data.push({ 
        Date: 'DEPOSITS', 
        Item: '', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': '' 
      });
      
      deposits.forEach(transaction => {
        data.push({
          Date: format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm'),
          Item: transaction.item_name,
          Quantity: transaction.quantity,
          'Unit Cost': transaction.unit_cost,
          'Total Cost': transaction.total_cost,
        });
      });
      
      // Add total deposits row
      data.push({ 
        Date: '', 
        Item: 'TOTAL DEPOSITS', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': totalDeposits 
      });
      
      // Add empty row for spacing
      data.push({ 
        Date: '', 
        Item: '', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': '' 
      });
    }

    // Add expenses section
    if (expenses.length > 0) {
      data.push({ 
        Date: 'TOTAL SPENDING', 
        Item: '', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': '' 
      });
      
      expenses.forEach(transaction => {
        data.push({
          Date: format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm'),
          Item: transaction.item_name,
          Quantity: transaction.quantity,
          'Unit Cost': transaction.unit_cost,
          'Total Cost': transaction.total_cost,
        });
      });
      
      // Add total expenses row
      data.push({ 
        Date: '', 
        Item: 'TOTAL SPENDING', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': totalExpenses 
      });
      
      // Add empty row for spacing
      data.push({ 
        Date: '', 
        Item: '', 
        Quantity: '', 
        'Unit Cost': '', 
        'Total Cost': '' 
      });
    }

    // Add balance section
    data.push({ 
      Date: '', 
      Item: 'BALANCE', 
      Quantity: '', 
      'Unit Cost': '', 
      'Total Cost': balance 
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Style the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Make headers and totals bold
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
        if (!worksheet[cell_address]) continue;
        
        const cell_value = worksheet[cell_address].v;
        if (typeof cell_value === 'string' && 
            (cell_value.includes('DEPOSITS') || 
             cell_value.includes('TOTAL SPENDING') || 
             cell_value.includes('BALANCE'))) {
          if (!worksheet[cell_address].s) worksheet[cell_address].s = {};
          worksheet[cell_address].s.font = { bold: true };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    
    const fileName = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Prepare daily spending chart data
  const getDailySpendingData = () => {
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    // Group by date
    const dailySpending = expenseTransactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += transaction.total_cost;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by date
    return Object.entries(dailySpending)
      .map(([date, amount]) => ({
        date: format(new Date(date), 'MMM dd'),
        fullDate: date,
        amount: amount,
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  };

  const chartData = getDailySpendingData();

  const periodOptions = [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-2-days', label: 'Last 2 Days' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const selectedPeriodLabel = periodOptions.find(p => p.value === selectedPeriod)?.label || 'Select Period';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600">
            View your spending patterns and financial insights
          </p>
        </div>

        {/* Time Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Time Period</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportToExcel}
              className="flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
          
          {/* Desktop View - Button Grid */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {periodOptions.map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Mobile View - Dropdown */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <span>{selectedPeriodLabel}</span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {periodOptions.map(period => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setSelectedPeriod(period.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left p-3 text-sm font-medium transition-colors hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        selectedPeriod === period.value
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {selectedPeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Transaction List - Now comes FIRST */}
        <div className="mb-8">
          <TransactionList 
            transactions={filteredTransactions} 
            showPagination={true}
            itemsPerPage={30}
          />
        </div>

        {/* Summary Cards - Now comes AFTER Transaction List */}
        {spendingSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(spendingSummary.total_spent)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(spendingSummary.total_deposits)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {spendingSummary.transaction_count}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(spendingSummary.avg_transaction)}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Spending Chart - Now comes LAST */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Spending
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Amount Spent']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `Date: ${payload[0].payload.fullDate}`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="amount" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};