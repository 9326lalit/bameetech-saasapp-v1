import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null; // ✅ Fix for MutationObserver error

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-white-900 p-6 rounded-xl shadow-lg w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Confirm Logout</h2>
          </div>

          <p className="text-gray-600 dark:text-black-300">
            Are you sure you want to logout from your account?
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white-300 text-white dark:bg-blue-700 rounded-md hover:bg-gray-400 hover:text-black transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
}
