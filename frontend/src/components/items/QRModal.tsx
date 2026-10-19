import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Download, Copy, Printer, Check, ExternalLink, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  qrId: string;
  onOpenPrintSheet: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  itemName,
  qrId,
  onOpenPrintSheet,
}) => {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const qrUrl = `${window.location.origin}/found/${qrId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      showToast('success', 'Public found page link copied to clipboard!');
    } catch (e) {
      showToast('info', `Link: ${qrUrl}`);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `lostlink-qr-${itemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showToast('success', 'QR code PNG downloaded successfully!');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item QR Code" maxWidth="md">
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-ink">{itemName}</h4>
          <p className="text-xs text-muted">
            Attach this code to your item. Finders scan this to alert you privately.
          </p>
        </div>

        {/* QR Canvas Box */}
        <div 
          ref={canvasRef}
          className="p-6 bg-white rounded-3xl border-2 border-line shadow-soft flex flex-col items-center"
        >
          <QRCodeCanvas
            value={qrUrl}
            size={220}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300A8E8'><path d='M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z'/></svg>",
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-sky" />
            <span>Privacy-Protected QR</span>
          </div>
        </div>

        {/* URL Pill */}
        <div className="w-full bg-paper p-2.5 rounded-2xl border border-line flex items-center justify-between text-xs text-muted overflow-hidden">
          <span className="truncate pr-2 font-mono text-[11px]">{qrUrl}</span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 p-1.5 hover:text-ink hover:bg-white rounded-xl transition-colors"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full pt-2">
          <Button variant="secondary" onClick={handleDownloadPNG} className="w-full">
            <Download className="w-4 h-4 mr-1.5 text-sky" />
            Download PNG
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onOpenPrintSheet();
            }}
            className="w-full"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Tag Sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
};
