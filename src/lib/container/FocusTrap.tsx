
import React, { useEffect, useRef } from 'react';

type FocusTrapProps = {
    children: React.ReactNode;
    active: boolean;
};

const candidatesSelector = [
  'input',
  'select',
  'textarea',
  'a[href]',
  'button',
  '[tabindex]',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

export const FocusTrap = ({ children, active }: FocusTrapProps) => {
    const focusTrapRef = useRef<HTMLDivElement>(null);
    let lastFocusedElement: HTMLElement | null = null;

    const getFocusableElements = (): HTMLElement[] => {
        if (!focusTrapRef.current) return [];

        return Array.from(
            focusTrapRef.current.querySelectorAll(candidatesSelector)
        ) as HTMLElement[];
    };

    const focusFirstElement = () => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length) {
            focusableElements[0].focus();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    };

    useEffect(() => {
        if (active) {
            lastFocusedElement = document.activeElement as HTMLElement;
            focusFirstElement();
            document.addEventListener('keydown', handleKeyDown);
        } else if (lastFocusedElement) {
            lastFocusedElement.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [active]);

    return <div ref={focusTrapRef}>{children}</div>;
};

