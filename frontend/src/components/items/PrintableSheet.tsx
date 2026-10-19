import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Shield, Scissors } from 'lucide-react';
import { ItemCategory } from '../../types';
import { formatCategoryName } from '../../utils/formatters';

interface PrintableSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  category: ItemCategory;
  qrId: string;
}

export const PrintableSheet: React.FC<PrintableSheetProps> = ({
  isOpen,
  onClose,
  itemName,
  category,
  qrId,
}) => {
  const qrUrl = `${window.location.origin}/found/${qrId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Printable Item Tags" maxWidth="lg">
      <div className="space-y-6">
        <p className="text-xs text-muted">
          Print this sheet on sticker paper, cardstock, or standard paper. Cut along the dashed lines and insert into your wallet, bag tag, or tape onto your gear.
        </p>

        {/* Printable Area */}
        <div id="printable-tags-area" className="p-4 bg-paper rounded-2xl border border-line space-y-4">
          <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-line">
            <Scissors className="w-3.5 h-3.5" />
            <span>Cut-out Tags Preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tag 1: Wallet / Card Format */}
            <div className="border-2 border-dashed border-line p-4 rounded-2xl bg-white text-center flex flex-col items-center justify-between min-h-[220px]">
              <div className="w-full flex items-center justify-between text-[10px] text-muted font-bold tracking-wider uppercase">
                <span className="flex items-center gap-1 text-ink">
                  <Shield className="w-3 h-3 text-sky" /> LostLink
                </span>
                <span>Wallet Tag</span>
              </div>

              <div className="my-2">
                <QRCodeSVG value={qrUrl} size={110} level="M" fgColor="#0A2540" />
              </div>

              <div>
                <p className="text-xs font-bold text-ink truncate max-w-[160px]">{itemName}</p>
                <p className="text-[10px] font-medium text-sky mt-0.5">SCAN IF FOUND TO NOTIFY OWNER</p>
                <p className="text-[9px] text-muted mt-0.5">Owner details kept 100% private</p>
              </div>
            </div>

            {/* Tag 2: Compact Keychain / Gadget Format */}
            <div className="border-2 border-dashed border-line p-4 rounded-2xl bg-white text-center flex flex-col items-center justify-between min-h-[220px]">
              <div className="w-full flex items-center justify-between text-[10px] text-muted font-bold tracking-wider uppercase">
                <span className="flex items-center gap-1 text-ink">
                  <Shield className="w-3 h-3 text-sky" /> LostLink
                </span>
                <span>Keychain Tag</span>
              </div>

              <div className="my-2">
                <QRCodeSVG value={qrUrl} size={110} level="M" fgColor="#0A2540" />
              </div>

              <div>
                <p className="text-xs font-bold text-ink truncate max-w-[160px]">{formatCategoryName(category)}</p>
                <p className="text-[10px] font-medium text-sky mt-0.5">SCAN IF FOUND</p>
                <p className="text-[9px] text-muted mt-0.5">lostlink.app/found</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
