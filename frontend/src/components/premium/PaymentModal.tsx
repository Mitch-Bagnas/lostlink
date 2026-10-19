import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Crown, CheckCircle2, ShieldCheck, Sparkles, CreditCard, Smartphone } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { upgradeToPremium } = useAuth();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'card'>('gcash');
  const [phoneNumber, setPhoneNumber] = useState('0917 123 4567');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Trigger API upgrade
      await upgradeToPremium(paymentMethod);

      // Trigger celebratory confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00A8E8', '#0A2540', '#15803D', '#FFD700'],
      });

      showToast('success', '🎉 Welcome to LostLink Premium! Your account has been upgraded.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('error', err.message || 'Payment simulation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Upgrade" maxWidth="md">
      <div className="space-y-6">
        {/* Sandbox Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-sky-light/80 border border-sky/20 flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-sky shrink-0 mt-0.5" />
          <div className="text-xs text-ink/80 leading-relaxed">
            <span className="font-bold text-ink">Simulated Sandbox Checkout:</span> No actual payment is charged. This mock checkout simulates Philippine digital payment methods (GCash, Maya, Card) structured for immediate Stripe/PayMongo swap-in.
          </div>
        </div>

        {/* Plan Summary */}
        <div className="p-4 rounded-2xl bg-paper border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">LostLink Premium (Monthly)</p>
              <p className="text-xs text-muted">Unlimited belongings + SMS alerts</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-ink">₱50<span className="text-xs font-normal text-muted">/mo</span></p>
            <p className="text-[10px] text-safe font-semibold">Billed monthly</p>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Select Payment Method (Philippines)
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('gcash')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky ${
                paymentMethod === 'gcash'
                  ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                  : 'border-line bg-white text-muted hover:border-line/80'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${paymentMethod === 'gcash' ? 'text-sky' : 'text-muted'}`} />
              <span className="text-xs">GCash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('maya')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky ${
                paymentMethod === 'maya'
                  ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                  : 'border-line bg-white text-muted hover:border-line/80'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${paymentMethod === 'maya' ? 'text-sky' : 'text-muted'}`} />
              <span className="text-xs">Maya</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky ${
                paymentMethod === 'card'
                  ? 'border-sky bg-sky-light text-ink font-bold shadow-sm'
                  : 'border-line bg-white text-muted hover:border-line/80'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-sky' : 'text-muted'}`} />
              <span className="text-xs">Card</span>
            </button>
          </div>
        </div>

        {/* Mock Account Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-ink">
            {paymentMethod === 'card' ? 'Card Number (Mock)' : 'Mobile Wallet Number'}
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sky"
            placeholder={paymentMethod === 'card' ? '4111 2222 3333 4444' : '0917 000 0000'}
          />
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-[11px] text-muted justify-center">
          <ShieldCheck className="w-4 h-4 text-safe" />
          <span>Encrypted simulated checkout. Cancel anytime from Settings.</span>
        </div>

        {/* Submit Button */}
        <Button
          variant="sky"
          size="lg"
          className="w-full font-bold shadow-md"
          isLoading={isProcessing}
          onClick={handleUpgrade}
        >
          Confirm & Pay ₱50.00
        </Button>
      </div>
    </Modal>
  );
};
