import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useIsMobile } from 'redux/selector/mobile';

interface ModalProps extends React.PropsWithChildren {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const isMobile = useIsMobile();

  return (
    <Transition appear show={isOpen || false} as={Fragment}>
      <Dialog as="div" onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95">
            <Dialog.Panel>
              <div
                className={`relative flex flex-col overflow-auto border border-sky-900 bg-blue-500 p-2 shadow-inner ${
                  isMobile
                    ? 'h-[80vh] w-[90vw] rounded-2xl'
                    : 'h-[60vh] max-h-[60rem] min-h-[50rem] w-[40vw] rounded-3xl'
                }`}>
                <div className="my-3 text-center">
                  <Dialog.Title>
                    <span
                      className={`font-fonarto font-normal leading-normal text-white text-stroke-black ${
                        isMobile ? 'text-4xl' : 'text-[3rem]'
                      }`}>
                      {title}
                    </span>
                  </Dialog.Title>
                </div>
                <button className="absolute right-5 top-7" onClick={onClose}>
                  <img className="h-8" src={require('assets/images/close.png').default.src} alt="close" />
                </button>
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
