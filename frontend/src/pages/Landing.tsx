import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { 
  Shield, 
  QrCode, 
  Lock, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  BellRing
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="space-y-24 py-8 sm:py-16">
      {/* 1. Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-light text-sky text-xs sm:text-sm font-bold tracking-wide border border-sky/20 animate-fade-in">
          <Shield className="w-4 h-4 fill-sky/20" />
          <span>RECOVER WHAT MATTERS, PRIVATELY</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-ink tracking-tight leading-[1.1]">
          Lost your wallet, bag, or laptop? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky to-[#007EA7]">
            Get it back without exposing your personal info.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted leading-relaxed">
          Traditional lost-and-found tags force you to write your phone number or home address in plain view. LostLink creates a unique, privacy-shielded QR code for each belonging. Finders scan it and notify you instantly — your contact info stays 100% confidential.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/auth?tab=signup" className="w-full sm:w-auto">
            <Button variant="sky" size="lg" className="w-full sm:w-auto text-base font-bold shadow-md hover:scale-105">
              Protect My Items Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
              See How It Works
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-safe" /> Zero Phone Number Leaks
          </span>
          <span className="flex items-center gap-1.5">
            <EyeOff className="w-4 h-4 text-safe" /> Email Remains Hidden
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-safe" /> Free Tier Available
          </span>
        </div>
      </section>

      {/* 2. Visual Demo Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-ink p-8 sm:p-12 text-white shadow-2xl overflow-hidden border border-line/20">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-sky/20 rounded-full blur-3xl" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-sky">Public Finder Experience</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                What a finder sees when they scan your QR code.
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                No login required for finders. They see only the item name, category, and an easy form to send you a message or leave their own contact details.
              </p>
              <div className="pt-2">
                <Link to="/auth?tab=signup">
                  <Button variant="sky" size="sm">
                    Generate Your First Tag
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mock Finder Preview Card */}
            <div className="bg-white rounded-2xl p-6 text-ink shadow-lift border border-line">
              <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-light text-sky flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">LostLink Public Scan</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lost-light text-lost">
                  MARKED LOST
                </span>
              </div>
              <p className="text-lg font-bold text-ink">Blue Samsonite Backpack</p>
              <p className="text-xs text-muted mt-0.5">Category: Bag / Luggage</p>

              <div className="mt-3 p-3 rounded-xl bg-paper border border-line text-xs text-muted leading-relaxed">
                🔒 <em>Owner's contact details are private. Type a message below and we will deliver it instantly.</em>
              </div>

              <div className="mt-3 space-y-2">
                <div className="w-full h-8 rounded-lg bg-paper border border-line text-xs text-muted/60 flex items-center px-3">
                  "Left it at Starbucks counter 2F..."
                </div>
                <div className="w-full py-2 rounded-full bg-ink text-white text-xs font-bold text-center">
                  Notify Owner Securely
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-sky">Simple 3-Step Process</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            How LostLink Protects Your Belongings
          </h3>
          <p className="text-sm text-muted max-w-lg mx-auto">
            From registration to private recovery in under two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-line shadow-soft space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center font-black text-lg">
              01
            </div>
            <h4 className="text-xl font-bold text-ink">Register Your Belonging</h4>
            <p className="text-sm text-muted leading-relaxed">
              Name your item (e.g. "Work Laptop" or "Dorm Keyring") and choose your category. A unique UUID QR code is automatically generated.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-line shadow-soft space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-sky text-white flex items-center justify-center font-black text-lg">
              02
            </div>
            <h4 className="text-xl font-bold text-ink">Print or Stick the Tag</h4>
            <p className="text-sm text-muted leading-relaxed">
              Download the high-resolution QR PNG or print out our ready-to-cut sticker & wallet card sheet on your home printer.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-line shadow-soft space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-safe text-white flex items-center justify-center font-black text-lg">
              03
            </div>
            <h4 className="text-xl font-bold text-ink">Instant Private Alert</h4>
            <p className="text-sm text-muted leading-relaxed">
              When someone scans the tag, they submit a message. LostLink immediately alerts your email and phone without sharing your contact info.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Free vs Premium Comparison */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-sky">Transparent Plans</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Free vs Premium
          </h3>
          <p className="text-sm text-muted max-w-lg mx-auto">
            Affordable protection designed for students, commuters, and everyday travelers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Card */}
          <div className="rounded-3xl bg-white border border-line p-8 shadow-soft flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-paper text-muted uppercase tracking-wider">
                Free Forever
              </span>
              <div className="space-y-1">
                <h4 className="text-3xl font-black text-ink">₱0</h4>
                <p className="text-xs text-muted">Ideal for key essentials like wallet and phone</p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-line text-sm text-ink/80">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                  <span>Up to <strong>3 registered belongings</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                  <span>Instant email alerts when item is scanned</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                  <span>High-resolution QR code downloads</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                  <span>Complete privacy protection for owner details</span>
                </li>
              </ul>
            </div>

            <Link to="/auth?tab=signup" className="w-full">
              <Button variant="secondary" size="lg" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Premium Card */}
          <div className="relative rounded-3xl bg-ink text-white border-2 border-sky p-8 shadow-lift flex flex-col justify-between space-y-6">
            <div className="absolute top-4 right-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky text-white uppercase tracking-wider">
                POPULAR
              </span>
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky uppercase tracking-wider">
                LostLink Premium
              </span>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <h4 className="text-4xl font-black text-white">₱50</h4>
                  <span className="text-xs text-white/60">/ month</span>
                </div>
                <p className="text-xs text-white/70">For gadgets, campus gear, travel luggage, and school gear</p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-white/10 text-sm text-white/90">
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky shrink-0" />
                  <span><strong>Unlimited belongings</strong> registered</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky shrink-0" />
                  <span><strong>Email + Phone SMS Alerts</strong> (Dual Notification)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky shrink-0" />
                  <span>Multi-tag printable sheet formats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky shrink-0" />
                  <span>Priority notification delivery</span>
                </li>
              </ul>
            </div>

            <Link to="/premium" className="w-full">
              <Button variant="sky" size="lg" className="w-full font-bold shadow-md">
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-sky">Got Questions?</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-ink">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-white rounded-2xl border border-line shadow-soft space-y-2">
            <h4 className="text-base font-bold text-ink">Can the person who finds my item see my phone number or email?</h4>
            <p className="text-sm text-muted leading-relaxed">
              No, never. The public QR page only displays the item name and category. All messages sent by the finder are routed through our servers directly to your private inbox.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-line shadow-soft space-y-2">
            <h4 className="text-base font-bold text-ink">Does the finder need to install an app or create an account?</h4>
            <p className="text-sm text-muted leading-relaxed">
              No. Any standard smartphone camera scans the QR code directly into the mobile browser. They can notify you in less than 30 seconds.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-line shadow-soft space-y-2">
            <h4 className="text-base font-bold text-ink">What happens if I exceed 3 items on the Free tier?</h4>
            <p className="text-sm text-muted leading-relaxed">
              The free tier supports up to 3 active belongings. If you need tags for more items, you can upgrade to Premium anytime for only ₱50/month to unlock unlimited belongings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
