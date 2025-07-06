import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFinance } from '../../contexts/FinanceContext';
import toast from 'react-hot-toast';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTransaction } = useFinance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        item_name: 'Deposit',
        description: '',
        quantity: 1,
        unit_cost: amountNumber,
        category: 'other',
        type: 'deposit',
      });
      
      setAmount('');
      onClose();
      // Note: Success message is now handled only in the FinanceContext
    } catch (error: any) {
      console.error('Error adding funds:', error);
      toast.error(error?.message || 'Failed to add funds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="Enter amount to add"
          disabled={loading}
        />
        
        <div className="flex space-x-3">
          <Button 
            type="submit" 
            loading={loading} 
            disabled={loading}
            className="flex-1"
          >
            Add Funds
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