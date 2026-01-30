import React, { useRef, useEffect } from 'react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    className?: string;
}

export const SimpleRichTextEditor: React.FC<Props> = ({ value, onChange, className }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isFocused = useRef(false);

    // Sync external value changes to DOM, but ONLY if not focused (to avoid cursor jumps)
    // or if the content is drastically different (e.g. loaded new chapter)
    useEffect(() => {
        if (editorRef.current) {
            // If we are not focused, we can safely sync
            if (!isFocused.current) {
                if (editorRef.current.innerHTML !== value) {
                    editorRef.current.innerHTML = value || '';
                }
            } 
            // If we ARE focused, we generally assumes our DOM is the source of truth.
            // However, if the value prop changed to something completely different 
            // (like switching chapters), we MUST update.
            // We can detect this if the difference is "large" or if we use a key prop in parent.
            // Best practice: Parent should use key={chapterId} to force remount on chapter change.
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            if (html !== value) {
                onChange(html);
            }
        }
    };

    return (
        <div
            ref={editorRef}
            contentEditable
            className={className}
            onInput={handleInput}
            onFocus={() => { isFocused.current = true; }}
            onBlur={() => { isFocused.current = false; }}
            suppressContentEditableWarning={true}
        />
    );
};
