"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import Loading from "../icons/Loading";
import GoogleIcon from "../icons/GoogleIcon";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loadingProvider, isAuthLoading, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      onClose();
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-md">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="px-4 pb-6 pt-5 sm:p-8">
                  <DialogTitle
                    as="h3"
                    className="mb-4 text-center text-xl font-semibold text-gray-900"
                  >
                    {t("signIn")}
                  </DialogTitle>

                  <p className="mb-6 text-center text-sm text-gray-600">
                    {t("account.signInPrompt")}
                  </p>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isAuthLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-60"
                  >
                    {loadingProvider === "google" ? (
                      <Loading size="small" color="black" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="text-sm font-medium">
                      {t("signInGoogle")}
                    </span>
                  </button>

                  <p className="mt-6 text-center text-xs text-gray-500">
                    {t("account.signInPrivacy")}
                  </p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
