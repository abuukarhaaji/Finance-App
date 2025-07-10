import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFinance } from '../../contexts/FinanceContext';
import { Transaction } from '../../types';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    quantity: '',
    unitCost: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { updateTransaction, validateTransaction, balance } = useFinance();

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        itemName: transaction.item_name,
        description: transaction.description || '',
        quantity: transaction.quantity.toString(),
        unitCost: transaction.unit_cost.toString(),
      });
      setValidationError('');
    }
  }, [transaction]);

  // For deposits, we only edit the total amount (treat as quantity=1, unitCost=amount)
  const isDeposit = transaction?.type === 'deposit';
  const quantity = isDeposit ? 1 : (parseInt(formData.quantity) || 0);
  const unitCost = parseFloat(formData.unitCost || '0');
  const totalCost = isDeposit ? unitCost : (quantity * unitCost);
  const originalCost = transaction ? transaction.total_cost : 0;
  const costDifference = totalCost - originalCost;
  const newBalance = balance - costDifference;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;
    
    if (!isDeposit && quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (totalCost <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // For expenses, validate sufficient funds considering the cost difference
    if (transaction.type === 'expense' && costDifference > 0) {
      const isValid = await validateTransaction(costDifference);
      if (!isValid) {
        setValidationError('Insufficient funds for this update');
        return;
      }
    }

    setLoading(true);
    setValidationError('');
    
    try {
      await updateTransaction(transaction.id, {
        item_name: formData.itemName,
        description: isDeposit ? '' : (formData.description || null),
        quantity: isDeposit ? 1 : quantity,
        unit_cost: unitCost,
      });
      
      onClose();
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setValidationError('');
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const canSubmit = formData.itemName && formData.unitCost && 
                   (!isDeposit ? (formData.quantity && quantity > 0) : true) && 
                   totalCost > 0 && 
                   (transaction?.type === 'deposit' || newBalance >= 0);

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit ${isDeposit ? 'Deposit' : 'Transaction'}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {isDeposit ? (
          // Simplified form for deposits - only item name and amount
          <div className="space-y-6">
            <Input
              label="Deposit Name"
              value={formData.itemName}
              onChange={(e) => handleInputChange('itemName', e.target.value)}
              required
              placeholder="e.g., Salary, Gift, etc."
              disabled={loading}
            />
            
            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) => handleInputChange('unitCost', e.target.value)}
              required
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        ) : (
          // Full form for expenses
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Item Name"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                required
                placeholder="What did you buy?"
                disabled={loading}
              />
            </div>
            
            <div className="md:col-span-2">
              <Input
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add a description..."
                disabled={loading}
              />
            </div>
            
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              required
              placeholder="Enter quantity"
              disabled={loading}
            />
            
            <Input
              label="Unit Cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) => handleInputChange('unitCost', e.target.value)}
              required
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        )}
        
        {/* Cost Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3 transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Original Cost:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(originalCost)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {isDeposit ? 'New Amount:' : 'New Total Cost:'}
            </span>
            <span className={`text-lg font-bold ${totalCost > balance && transaction.type === 'expense' && costDifference > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(totalCost)}
            </span>
          </div>
          
          {costDifference !== 0 && (
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isDeposit 
                  ? (costDifference > 0 ? 'Additional Deposit:' : 'Deposit Reduction:')
                  : (costDifference > 0 ? 'Additional Cost:' : 'Cost Reduction:')
                }
              </span>
              <span className={`text-sm font-bold ${costDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {costDifference > 0 ? '+' : ''}{formatCurrency(costDifference)}
              </span>
            </div>
          )}
          
          {!isDeposit && (
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">New Balance:</span>
              <span className={`text-sm font-bold ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(newBalance)}
              </span>
            </div>
          )}
          
          {transaction.type === 'expense' && costDifference > 0 && newBalance < 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Insufficient funds. Current balance: {formatCurrency(balance)}
            </p>
          )}
        </div>
        
        {validationError && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 transition-colors">
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button
            type="submit"
            loading={loading}
            disabled={!canSubmit}
            className="flex-1"
          >
            Update {isDeposit ? 'Deposit' : 'Transaction'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};