import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFinance } from '../../contexts/FinanceContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export const TransactionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 1,
    unitCost: '',
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { addTransaction, validateTransaction, balance, generateSampleData, loading: contextLoading } = useFinance();

  const totalCost = formData.quantity * parseFloat(formData.unitCost || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalCost <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate sufficient funds
    const isValid = await validateTransaction(totalCost);
    if (!isValid) {
      setValidationError('Insufficient funds for this transaction');
      return;
    }

    setLoading(true);
    setValidationError('');
    
    try {
      await addTransaction({
        item_name: formData.itemName,
        description: '',
        quantity: formData.quantity,
        unit_cost: parseFloat(formData.unitCost),
        category: 'other',
        type: 'expense',
      });
      
      // Reset form
      setFormData({
        itemName: '',
        quantity: 1,
        unitCost: '',
      });
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const canSubmit = formData.itemName && formData.unitCost && totalCost > 0 && totalCost <= balance;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">New Transaction</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={generateSampleData}
          loading={contextLoading}
          disabled={contextLoading}
        >
          Generate Sample Data
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Item Name"
              value={formData.itemName}
              onChange={(e) => handleInputChange('itemName', e.target.value)}
              required
              placeholder="What did you buy?"
            />
          </div>
          
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
            required
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
          />
        </div>
        
        {/* Total Cost Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Cost:</span>
            <span className={`text-lg font-bold ${totalCost > balance ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(totalCost)}
            </span>
          </div>
          {totalCost > balance && (
            <p className="text-sm text-red-600 mt-1">
              Insufficient funds. Current balance: {formatCurrency(balance)}
            </p>
          )}
        </div>
        
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}
        
        <Button
          type="submit"
          loading={loading}
          disabled={!canSubmit}
          className="w-full"
        >
          Add Transaction
        </Button>
      </form>
    </div>
  );
};