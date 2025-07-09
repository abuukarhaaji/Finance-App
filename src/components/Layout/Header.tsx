import React, { useState } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import { AddFundsModal } from '../Finance/AddFundsModal';
import { AuthModal } from '../Auth/AuthModal';
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  PlusIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { balance } = useFinance();
  const { user, signOut } = useAuth();
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
              {user && (
                <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance:</span>
                <span className={`text-lg font-bold ${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
                </div>
              )}

              {/* Add Funds Button - only show on New Transaction page */}
              {user && isNewTransactionPage && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddFundsModalOpen(true)}
                >
                  Add Funds
                </Button>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.email?.split('@')[0]}
                    </span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign In
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
                {user && (
                  <>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Balance:</span>
                <span className={`text-sm font-bold ${balance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </span>
                  </>
                )}
                <DarkModeToggle />
              </div>
            </div>

            {/* Second Line: Conditional Navigation */}
            <div className="flex items-center justify-center space-x-4">
              {user && isNewTransactionPage ? (
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
              ) : user ? (
                // Dashboard page: Show only New Transaction
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Transaction</span>
                </Link>
              ) : (
                // Not signed in: Show sign in button
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AddFundsModal isOpen={addFundsModalOpen} onClose={() => setAddFundsModalOpen(false)} />
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode="signin"
      />
    </>
  );
};