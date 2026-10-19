import React from 'react';
import { Shield, Lock, EyeOff, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-white/90 border-t border-ink-hover mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Lost<span className="text-sky">Link</span>
              </span>
            </div>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              Tagline: <em>"Recover what matters, privately."</em>
              <br />
              Protect your belongings with custom, privacy-shielded QR tags. Connect finders to owners in one scan without ever revealing private personal contact information.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/60 pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-sky" /> Zero Info Leaks
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-sky" /> Owner Identity Hidden
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky">Platform</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <Link to="/premium" className="hover:text-white transition-colors">
                  LostLink Premium (₱50/mo)
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Ethics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky">Privacy Pledge</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              We believe returning lost belongings shouldn't require surrendering your personal cell number or home address. All messages are securely routed through our privacy relay.
            </p>
            <div className="text-[11px] text-white/50 pt-2">
              Built with security & privacy by design.
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} LostLink. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for privacy <Heart className="w-3 h-3 text-sky fill-sky" />
          </p>
        </div>
      </div>
    </footer>
  );
};
