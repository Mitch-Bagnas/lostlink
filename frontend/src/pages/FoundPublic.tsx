import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiClient } from '../api/client';
import { PublicFoundItem } from '../types';
import { formatCategoryName } from '../utils/formatters';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { 
  Shield, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  MessageSquare, 
  Phone,
  Heart,
  QrCode
} from 'lucide-react';

export const FoundPublic: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();

  const [item, setItem] = useState<PublicFoundItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [message, setMessage] = useState('');
  const [finderContact, setFinderContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItem() {
      if (!qrId) return;
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await apiClient<PublicFoundItem>(`/found/${qrId}`, {
          skipAuthRedirect: true,
        });
        setItem(data);
      } catch (err: any) {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setErrorMsg(err.message || 'Unable to load item.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchItem();
  }, [qrId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrId) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient(`/found/${qrId}/notify`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim() || undefined,
          finder_contact: finderContact.trim() || undefined,
        }),
        skipAuthRedirect: true,
      });

      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00A8E8', '#15803D', '#0A2540'],
      });
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to send notification to the owner. Please try again in a few moments.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-muted mt-3">Connecting to LostLink...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-paper border border-line flex items-center justify-center mx-auto text-muted">
          <QrCode className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-ink">Unknown QR Code</h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            This QR code is either invalid or the belonging has been unregistered by its owner.
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary" size="md">
            Go to LostLink Home
          </Button>
        </Link>
      </div>
    );
  }

  if (!item) return null;

  const isLost = item.status === 'lost';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-16 space-y-8 animate-fade-in">
      {/* Brand Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-line shadow-sm text-xs font-bold text-ink">
          <Shield className="w-4 h-4 text-sky" />
          <span>LostLink Private Recovery Relay</span>
        </div>
      </div>

      {isSuccess ? (
        /* Success Confirmation */
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-line shadow-lift text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-safe-light text-safe flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-ink">Owner Notified!</h2>
            <p className="text-sm text-muted leading-relaxed">
              Thank you for being a good Samaritan! Your message has been securely relayed to the owner's email.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-paper border border-line text-xs text-muted leading-relaxed">
            ✨ Because of you, <strong>{item.name}</strong> has a safe path back to its owner.
          </div>

          <div className="pt-2">
            <Link to="/">
              <Button variant="secondary" size="sm">
                Learn more about LostLink
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Found Form */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-line shadow-lift space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 pb-6 border-b border-line">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1"
              style={{
                backgroundColor: isLost ? '#FFEDD5' : '#DCFCE7',
                color: isLost ? '#C2540A' : '#15803D',
              }}
            >
              {isLost ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Marked Lost by Owner
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Protected Belonging
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              You found: {item.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium">
              Category: {formatCategoryName(item.category)}
            </p>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-2xl bg-paper border border-line flex items-start gap-3">
            <Lock className="w-5 h-5 text-sky shrink-0 mt-0.5" />
            <div className="text-xs text-ink/80 leading-relaxed">
              <span className="font-bold text-ink">Privacy Protection Active:</span> The owner's personal contact details are completely confidential. Send a note below and LostLink will immediately deliver it to them.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-lost-light border border-lost/20 text-lost text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Message Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-sky" />
                Where is the item right now? *
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Left it with Guard Ronald at the 2nd-floor CS Building security desk."
                className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            {/* Optional Finder Contact */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sky" />
                Your contact info <span className="text-muted font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={finderContact}
                onChange={(e) => setFinderContact(e.target.value)}
                placeholder="Phone number, Instagram, or desk location"
                className="w-full px-4 py-2.5 rounded-2xl border border-line bg-paper text-sm text-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
              <p className="text-[11px] text-muted">
                If you wish to coordinate the handover directly, provide your contact details above.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full font-bold shadow-md"
            >
              <Send className="w-4 h-4 mr-2 text-sky" />
              Notify Owner Immediately
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted flex items-center justify-center gap-1">
            <span>Powered by LostLink</span>
            <span className="text-sky font-semibold">Privacy Relay</span>
          </div>
        </div>
      )}
    </div>
  );
};
