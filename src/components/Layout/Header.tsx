import React, { useState } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { Button } from '../ui/Button';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { AddFundsModal } from '../Finance/AddFundsModal';
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { balance } = useFinance();
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const location = useLocation();

  const isNewTransactionPage = location.pathname === '/';
  const isDashboardPage = location.pathname === '/dashboard';

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">FinanceTracker</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              {!isNewTransactionPage && (
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Transaction</span>
                </Link>
              )}
              {!isDashboardPage && (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Balance Display */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance:</span>
                <span className={`text-lg font-bold ${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
              </div>

              {/* Add Funds Button - only show on New Transaction page */}
              {isNewTransactionPage && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddFundsModalOpen(true)}
                >
                  Add Funds
                </Button>
              )}
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden py-3">
            {/* First Line: Logo and Balance */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="h-7 w-7 text-blue-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">FinanceTracker</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Balance:</span>
                <span className={`text-sm font-bold ${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
                <DarkModeToggle />
              </div>
            </div>

            {/* Second Line: Conditional Navigation */}
            <div className="flex items-center justify-center space-x-4">
              {isNewTransactionPage ? (
                // New Transaction page: Show Dashboard + Add Funds
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAddFundsModalOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Funds</span>
                  </Button>
                </>
              ) : (
                // Dashboard page: Show only New Transaction
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Transaction</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <AddFundsModal isOpen={addFundsModalOpen} onClose={() => setAddFundsModalOpen(false)} />
    </>
  );
};