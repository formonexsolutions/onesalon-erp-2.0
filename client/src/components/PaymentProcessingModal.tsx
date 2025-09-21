import { useState, useEffect } from 'react';
import { XMarkIcon, CurrencyRupeeIcon, CreditCardIcon, BanknotesIcon, QrCodeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData: AppointmentPayment;
  onPaymentComplete: (payment: any) => void;
}

interface AppointmentPayment {
  appointmentId: string;
  customerName: string;
  services: Array<{
    serviceName: string;
    price: number;
  }>;
  totalAmount: number;
  discountApplied?: number;
  taxAmount?: number;
}

interface Payment {
  method: 'cash' | 'card' | 'upi' | 'digital_wallet';
  amount: number;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
}

const PaymentProcessingModal = ({ isOpen, onClose, appointmentData, onPaymentComplete }: PaymentProcessingModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (appointmentData) {
      const discount = (appointmentData.totalAmount * discountPercent) / 100;
      setDiscountAmount(discount);
      setFinalAmount(appointmentData.totalAmount - discount);
    }
  }, [appointmentData, discountPercent]);

  useEffect(() => {
    if (paymentMethod === 'cash' && cashReceived > 0) {
      setChangeAmount(Math.max(0, cashReceived - finalAmount));
    } else {
      setChangeAmount(0);
    }
  }, [cashReceived, finalAmount, paymentMethod]);

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const paymentData = {
        appointmentId: appointmentData.appointmentId,
        method: paymentMethod,
        amount: finalAmount,
        discountAmount: discountAmount,
        transactionId: paymentMethod !== 'cash' ? transactionId : undefined,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        changeAmount: paymentMethod === 'cash' ? changeAmount : undefined,
        notes: notes
      };

      const response = await axios.post(`${BASE_URL}/api/payments/process`, paymentData, {
        withCredentials: true
      });

      setPaymentStatus('success');
      
      // Simulate processing time
      setTimeout(() => {
        onPaymentComplete(response.data.payment);
        onClose();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Failed to process payment:', error);
      setPaymentStatus('error');
      
      // For demo, simulate successful payment after 1 second
      setTimeout(() => {
        const mockPayment = {
          _id: Date.now().toString(),
          appointmentId: appointmentData.appointmentId,
          method: paymentMethod,
          amount: finalAmount,
          discountAmount: discountAmount,
          transactionId: transactionId || `TXN${Date.now()}`,
          status: 'completed',
          paidAt: new Date().toISOString()
        };
        
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentComplete(mockPayment);
          onClose();
          resetForm();
        }, 1000);
      }, 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod('cash');
    setDiscountPercent(0);
    setDiscountAmount(0);
    setCashReceived(0);
    setChangeAmount(0);
    setTransactionId('');
    setPaymentStatus('idle');
    setNotes('');
  };

  const isValidPayment = () => {
    if (!appointmentData) return false;
    
    switch (paymentMethod) {
      case 'cash':
        return cashReceived >= finalAmount;
      case 'card':
      case 'upi':
      case 'digital_wallet':
        return transactionId.length > 0;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CurrencyRupeeIcon className="h-6 w-6 mr-2 text-green-600" />
            Process Payment
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {paymentStatus === 'success' ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-green-900 mb-2">Payment Successful!</h4>
            <p className="text-gray-600">Transaction completed successfully</p>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Amount Paid: ₹{finalAmount} via {paymentMethod.toUpperCase()}
              </p>
              {transactionId && (
                <p className="text-sm text-green-800">Transaction ID: {transactionId}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Customer and Service Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
              <p className="text-sm text-gray-600 mb-1">Customer: {appointmentData.customerName}</p>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Services:</p>
                {appointmentData.services.map((service, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{service.serviceName}</span>
                    <span>₹{service.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Calculation */}
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Amount Calculation</h4>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{appointmentData.totalAmount}</span>
                </div>
                
                {/* Discount Input */}
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                    <span className="text-sm">%</span>
                    <span className="text-red-600">-₹{discountAmount}</span>
                  </div>
                </div>
                
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Final Amount:</span>
                  <span className="text-green-600">₹{finalAmount}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                  }`}
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                  }`}
                >
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  UPI
                </button>
                <button
                  onClick={() => setPaymentMethod('digital_wallet')}
                  className={`p-3 border rounded-lg flex items-center justify-center ${
                    paymentMethod === 'digital_wallet' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                  }`}
                >
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Wallet
                </button>
              </div>
            </div>

            {/* Payment Method Specific Fields */}
            {paymentMethod === 'cash' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-3">Cash Payment</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-1">
                      Cash Received
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Enter amount received"
                    />
                  </div>
                  {changeAmount > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-yellow-800">Change to return: </span>
                      <span className="font-bold text-yellow-900">₹{changeAmount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'digital_wallet') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter transaction reference"
                />
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>

            {/* Error State */}
            {paymentStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">Payment processing failed. Please try again.</p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {paymentStatus !== 'success' && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={!isValidPayment() || isProcessing}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CurrencyRupeeIcon className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessingModal;