/** Open the native file browser and resolve with the picked file (or null). */
export function pickFile(accept = 'image/png,image/jpeg,image/webp'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files && input.files.length > 0 ? input.files[0] : null);
    // Fired when the dialog is dismissed without a choice (Chromium).
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}
