import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Package, 
  Droplet, 
  Leaf, 
  ZapOff, 
  Layers, 
  Truck,
  ArrowRight,
  Send
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface OrderTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackage?: 'stickers' | 'keychain' | 'bundle';
}

export const OrderTagsModal: React.FC<OrderTagsModalProps> = ({
  isOpen,
  onClose,
  defaultPackage = 'bundle',
}) => {
  const { showToast } = useToast();
  const [selectedPack, setSelectedPack] = useState<'stickers' | 'keychain' | 'bundle'>(defaultPackage);
  const [fullName, setFullName] = useState('');
  const [campusOrAddress, setCampusOrAddress] = useState('');
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'cod'>('gcash');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packages = {
    stickers: {
      name: 'Eco-Smart Vinyl Sticker 3-Pack',
      price: 150,
      badge: 'Popular for Laptops & Bottles',
      desc: '3x durable, scratch-resistant, dishwasher-safe rPET stickers with high-contrast QR targets.',
      specs: '30mm × 30mm • 1.2g • 100% Recycled PET • Food-Safe BPA-Free Adhesive'
    },
    bundle: {
      name: 'Student Campus Complete Bundle',
      price: 199,
      badge: 'Best Value (Save ₱50)',
      desc: '2x Weatherproof rPET Stickers + 1x Heavy-Duty Acrylic Keychain Tag with brass eyelet & steel ring.',
      specs: 'Full set for phone, bag, and tumbler • Includes compostable kraft envelope'
    },
    keychain: {
      name: 'Heavy-Duty Acrylic Keychain Tag',
      price: 99,
      badge: 'For Backpacks & Keys',
      desc: '1x impact-resistant recycled acrylic luggage/key tag with stainless steel split ring.',
      specs: '45mm × 28mm × 2.5mm • 6.5g • Waterproof • Reinforced 4mm brass eyelet'
    }
  };

  const currentPack = packages[selectedPack];
  const totalPrice = currentPack.price * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !campusOrAddress.trim() || !contactEmailOrPhone.trim()) {
      showToast('error', 'Please fill in all order details.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('success', 'Order request received! We will coordinate your campus delivery.');
    }, 600);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} title="Order Official LostLink Smart Tags" maxWidth="lg">
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sustainability & Quality Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-paper rounded-xl border border-line flex flex-col items-center">
              <Leaf className="w-4 h-4 text-safe mb-1" />
              <span className="text-[11px] font-bold text-ink">100% rPET</span>
              <span className="text-[9px] text-muted">Recycled Ocean Plastic</span>
            </div>
            <div className="p-2.5 bg-paper rounded-xl border border-line flex flex-col items-center">
              <ZapOff className="w-4 h-4 text-sky mb-1" />
              <span className="text-[11px] font-bold text-ink">0% Batteries</span>
              <span className="text-[9px] text-muted">Passive & Zero Waste</span>
            </div>
            <div className="p-2.5 bg-paper rounded-xl border border-line flex flex-col items-center">
              <Droplet className="w-4 h-4 text-sky mb-1" />
              <span className="text-[11px] font-bold text-ink">Dishwasher-Safe</span>
              <span className="text-[9px] text-muted">Water & Oil Proof</span>
            </div>
            <div className="p-2.5 bg-paper rounded-xl border border-line flex flex-col items-center">
              <Layers className="w-4 h-4 text-ink mb-1" />
              <span className="text-[11px] font-bold text-ink">Matte UV Shield</span>
              <span className="text-[9px] text-muted">Scratch-Resistant</span>
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Select Tag Package
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(packages) as Array<keyof typeof packages>).map((key) => {
                const pkg = packages[key];
                const isSelected = selectedPack === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPack(key)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-sky bg-sky/5 shadow-soft ring-2 ring-sky/20'
                        : 'border-line bg-white hover:bg-paper'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        isSelected ? 'bg-sky text-white' : 'bg-paper text-muted'
                      }`}>
                        {pkg.badge}
                      </span>
                      <h4 className="text-xs font-bold text-ink leading-snug">{pkg.name}</h4>
                    </div>
                    <div className="pt-3 flex items-baseline justify-between border-t border-line/50 mt-2">
                      <span className="text-base font-black text-ink">₱{pkg.price}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Package Specs Box */}
          <div className="p-3.5 bg-paper rounded-2xl border border-line text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-ink">
              <span>{currentPack.name}</span>
              <span>₱{currentPack.price}</span>
            </div>
            <p className="text-muted leading-relaxed">{currentPack.desc}</p>
            <div className="pt-1 text-[10px] text-muted/80 font-mono">
              📐 Specs: {currentPack.specs}
            </div>
          </div>

          {/* Delivery & Order Details */}
          <div className="space-y-3 pt-2 border-t border-line">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-sky" /> Shipping / Campus Pickup Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Contact Email or Mobile</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0917XXXXXXX or name@email.com"
                  value={contactEmailOrPhone}
                  onChange={(e) => setContactEmailOrPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Campus, Student Org, or Delivery Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. University of the Philippines Diliman / DLSU / Home Address"
                value={campusOrAddress}
                onChange={(e) => setCampusOrAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Quantity</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-sky font-medium"
                >
                  <option value={1}>1 Set</option>
                  <option value={2}>2 Sets (Share with a friend)</option>
                  <option value={3}>3 Sets</option>
                  <option value={5}>5 Sets (Barkada pack)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-sky font-medium"
                >
                  <option value="gcash">GCash (Instant)</option>
                  <option value="maya">Maya</option>
                  <option value="cod">Cash on Campus Meetup</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Summary & Submit */}
          <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-line flex items-center justify-between z-10">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted block">Order Total</span>
              <span className="text-xl font-black text-ink">₱{totalPrice}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="sky" size="md" isLoading={isSubmitting} className="font-bold">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit Tag Order
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-safe-light text-safe flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-ink">Tag Order Request Submitted!</h3>
            <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
              Thank you, <strong>{fullName}</strong>. We've logged your request for <strong>{quantity}x {currentPack.name}</strong> (Total: ₱{totalPrice}).
            </p>
          </div>
          <div className="p-4 bg-paper rounded-2xl border border-line max-w-sm mx-auto text-xs text-left space-y-2">
            <p className="text-ink font-semibold">What happens next?</p>
            <ul className="space-y-1.5 text-muted text-[11px]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" />
                <span>We will contact you via <strong>{contactEmailOrPhone}</strong> for {paymentMethod.toUpperCase()} payment and dispatch details.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-safe shrink-0 mt-0.5" />
                <span>Each physical tag comes with an easy one-step scan code to link directly into your LostLink account.</span>
              </li>
            </ul>
          </div>
          <Button variant="sky" size="md" onClick={handleResetAndClose} className="font-bold">
            Back to Dashboard
          </Button>
        </div>
      )}
    </Modal>
  );
};
