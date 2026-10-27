import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
    forwardRef,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type SelectHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';

export const Button = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' }
>(function Button({ className, variant = 'primary', type = 'button', ...props }, ref) {
    return (
        <button
            ref={ref}
            type={type}
            className={clsx('button', 'button--' + variant, className)}
            {...props}
        />
    );
});
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx('card', className)} {...props} />;
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className, ...props }, ref) {
        return <input ref={ref} className={clsx('input', className)} {...props} />;
    },
);
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
    function Select({ className, ...props }, ref) {
        return <select ref={ref} className={clsx('input', 'select', className)} {...props} />;
    },
);
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
    return <span className={clsx('badge', className)} {...props} />;
}
export function Modal({
    open,
    onOpenChange,
    title,
    children,
    closeLabel,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    closeLabel: string;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="modal-overlay" />
                <Dialog.Content className="modal-content" aria-describedby={undefined}>
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Close className="modal-close" aria-label={closeLabel}>
                        <X size={20} />
                    </Dialog.Close>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
    return (
        <ol className="stepper">
            {steps.map((step, index) => (
                <li
                    key={step}
                    aria-current={index === current ? 'step' : undefined}
                    className={clsx(index <= current && 'is-active')}
                >
                    <span>{index + 1}</span>
                    {step}
                </li>
            ))}
        </ol>
    );
}
