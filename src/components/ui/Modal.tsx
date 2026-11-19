import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Btn } from './kit';

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="modal-head">
              <h3>{title}</h3>
              <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </header>
            <div className="modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Confirmation dialog (prevents accidental resets / deletes)
// ---------------------------------------------------------------------------

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const ask: ConfirmFn = (options) =>
    new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPending(options);
    });

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <Modal open={pending !== null} onClose={() => settle(false)} title={pending?.title ?? ''} width={420}>
        {pending && (
          <div className="confirm">
            <div className="confirm-icon">
              <AlertTriangle size={22} />
            </div>
            <p className="confirm-message">{pending.message}</p>
            <div className="confirm-actions">
              <Btn onClick={() => settle(false)}>Cancel</Btn>
              <Btn
                variant={pending.danger ? 'danger' : 'primary'}
                autoFocus
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}
