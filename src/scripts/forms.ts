import { submitForm, type FormKind } from '@/lib/api';
import { isPreview } from '@/config/build';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const MESSAGES = {
  required: 'This field is required.',
  email: 'Please enter a valid email address.',
  tel: 'Please enter a valid phone number.',
  consent: 'Please confirm you agree to the Privacy Notice.',
  pattern: 'Please check the format of this field.',
  tooLong: 'This entry is too long.',
};

/** Default upload rules — mirrored in docs/API.md and enforced again server-side. */
export const UPLOAD_RULES = {
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 15 * 1024 * 1024,
  extensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
};

const formatBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

function validateFiles(input: HTMLInputElement): string {
  const files = Array.from(input.files ?? []);
  const maxFiles = Number(input.dataset.maxFiles ?? 5);
  const maxBytes = Number(input.dataset.maxBytes ?? UPLOAD_RULES.maxFileBytes);
  const allowed = (input.dataset.extensions ?? UPLOAD_RULES.extensions.join(',')).split(',');
  if (input.required && files.length === 0) return 'Please attach a file.';
  if (files.length > maxFiles) return `Please attach no more than ${maxFiles} files.`;
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowed.includes(ext)) return `“${f.name}” is not an accepted file type (${allowed.join(', ').toUpperCase()}).`;
    if (f.size > maxBytes) return `“${f.name}” is larger than ${formatBytes(maxBytes)}.`;
    if (f.size === 0) return `“${f.name}” appears to be empty.`;
  }
  return '';
}

function messageFor(el: Control): string {
  if (el instanceof HTMLInputElement && el.type === 'file') return validateFiles(el);
  const v = el.validity;
  if (el instanceof HTMLInputElement && el.type === 'checkbox' && v.valueMissing) return MESSAGES.consent;
  if (v.valueMissing) return el.dataset.requiredMessage ?? MESSAGES.required;
  if (v.typeMismatch && el.type === 'email') return MESSAGES.email;
  if (v.patternMismatch) return el.type === 'tel' ? MESSAGES.tel : MESSAGES.pattern;
  if (v.tooLong) return MESSAGES.tooLong;
  if (!v.valid) return el.validationMessage;
  return '';
}

function setError(el: Control, msg: string) {
  const field = el.closest<HTMLElement>('[data-field]');
  if (!field) return;
  const err = field.querySelector<HTMLElement>('.field-error');
  field.dataset.invalid = msg ? 'true' : 'false';
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) {
    err.textContent = msg;
    err.classList.toggle('hidden', !msg);
  }
}

function validate(el: Control): boolean {
  const msg = messageFor(el);
  setError(el, msg);
  return !msg;
}

export function bindForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';

    const kind = form.dataset.form as FormKind;
    const started = form.querySelector<HTMLInputElement>('[data-started-at]');
    if (started) started.value = String(Date.now());

    // Pre-select service when arriving from a service detail CTA (?service=...)
    const serviceParam = new URLSearchParams(window.location.search).get('service');
    if (serviceParam) {
      const sel = form.querySelector<HTMLSelectElement>('select[name="service"]');
      if (sel && Array.from(sel.options).some((o) => o.value === serviceParam)) {
        sel.value = serviceParam;
        const field = sel.closest<HTMLElement>('[data-field]');
        if (field) field.dataset.filled = 'true';
      }
    }

    // Interactive file upload dropzones (drag/drop + file list + remove)
    form.querySelectorAll<HTMLElement>('[data-file-upload]').forEach((wrap) => {
      const input = wrap.querySelector<HTMLInputElement>('input[type=file]');
      const zone = wrap.querySelector<HTMLElement>('[data-dropzone]');
      const list = wrap.querySelector<HTMLElement>('[data-file-list]');
      if (!input || !zone || !list) return;

      const renderList = () => {
        const files = Array.from(input.files ?? []);
        list.innerHTML = '';
        files.forEach((file, idx) => {
          const li = document.createElement('li');
          li.className = 'flex items-center justify-between gap-4 border border-rule bg-paper px-4 py-2.5 text-[0.875rem]';
          const info = document.createElement('span');
          info.className = 'min-w-0 truncate text-ink';
          info.textContent = `${file.name} `;
          const sz = document.createElement('span');
          sz.className = 'text-ink-400';
          sz.textContent = `(${formatBytes(file.size)})`;
          info.appendChild(sz);

          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'shrink-0 text-[0.8125rem] font-medium text-ink-500 underline underline-offset-4 hover:text-signal';
          rm.textContent = 'Remove';
          rm.setAttribute('aria-label', `Remove ${file.name}`);
          rm.addEventListener('click', () => {
            const dt = new DataTransfer();
            Array.from(input.files ?? []).forEach((f, i) => i !== idx && dt.items.add(f));
            input.files = dt.files;
            renderList();
            validate(input);
          });

          li.append(info, rm);
          list.appendChild(li);
        });
      };

      const mergeFiles = (incoming: FileList) => {
        const dt = new DataTransfer();
        if (input.multiple) {
          Array.from(input.files ?? []).forEach((f) => dt.items.add(f));
        }
        Array.from(incoming).forEach((f) => dt.items.add(f));
        input.files = dt.files;
        renderList();
        validate(input);
      };

      input.addEventListener('change', () => renderList());

      ['dragenter', 'dragover'].forEach((ev) =>
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          wrap.dataset.dragging = 'true';
        }),
      );
      ['dragleave', 'drop'].forEach((ev) =>
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          wrap.dataset.dragging = 'false';
        }),
      );
      zone.addEventListener('drop', (e) => {
        const dt = (e as DragEvent).dataTransfer;
        if (dt?.files.length) mergeFiles(dt.files);
      });
    });

    const controls = () =>
      Array.from(form.querySelectorAll<Control>('input:not([type=hidden]):not([name=website]), select, textarea'));

    controls().forEach((el) => {
      const field = el.closest<HTMLElement>('[data-field]');
      const sync = () => field && (field.dataset.filled = String(Boolean(el.value)));
      el.addEventListener('blur', () => {
        if (el.value || el.closest('[data-field]')?.getAttribute('data-invalid') === 'true') validate(el);
      });
      el.addEventListener('input', () => {
        sync();
        if (field?.dataset.invalid === 'true') validate(el);
      });
      el.addEventListener('change', () => {
        sync();
        if (el instanceof HTMLInputElement && el.type === 'file') validate(el);
      });
      sync();
    });

    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]');
    const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
    const defaultLabel = submitLabel?.textContent ?? 'Submit';

    const showStatus = (tone: 'success' | 'error', title: string, body: string) => {
      if (!status) return;
      status.dataset.tone = tone;
      status.classList.remove('hidden');
      status.querySelector('[data-status-title]')!.textContent = title;
      status.querySelector('[data-status-body]')!.textContent = body;
      status.focus({ preventScroll: false });
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.busy === 'true') return;

      const invalid = controls().filter((el) => !validate(el));
      if (invalid.length) {
        invalid[0].focus();
        showStatus('error', 'Please review the highlighted fields.', `${invalid.length} field${invalid.length > 1 ? 's need' : ' needs'} attention.`);
        return;
      }

      // Total upload size guard
      const files = Array.from(form.querySelectorAll<HTMLInputElement>('input[type=file]')).flatMap((i) => Array.from(i.files ?? []));
      const total = files.reduce((s, f) => s + f.size, 0);
      if (total > UPLOAD_RULES.maxTotalBytes) {
        showStatus('error', 'Attachments are too large.', `Total upload size must be under ${formatBytes(UPLOAD_RULES.maxTotalBytes)}.`);
        return;
      }

      const data = new FormData(form);
      // Honeypot tripped: pretend success, send nothing.
      if (String(data.get('website') ?? '').trim()) {
        form.reset();
        showStatus('success', isPreview ? 'Demo complete.' : 'Thank you.', isPreview ? 'Nothing was sent, uploaded, or stored.' : 'Your submission has been received.');
        return;
      }
      data.set('page_url', window.location.origin + window.location.pathname);

      form.dataset.busy = 'true';
      submitBtn?.setAttribute('disabled', '');
      submitBtn?.setAttribute('aria-busy', 'true');
      if (submitLabel) submitLabel.textContent = isPreview ? 'Testing…' : 'Sending…';

      const result = await submitForm(kind, data);

      form.dataset.busy = 'false';
      submitBtn?.removeAttribute('disabled');
      submitBtn?.removeAttribute('aria-busy');
      if (submitLabel) submitLabel.textContent = defaultLabel;

      if (result.ok) {
        form.reset();
        controls().forEach((el) => {
          const f = el.closest<HTMLElement>('[data-field]');
          if (f) f.dataset.filled = 'false';
        });
        form.querySelectorAll('[data-file-list]').forEach((l) => (l.innerHTML = ''));
        if (started) started.value = String(Date.now());
        showStatus('success', isPreview ? 'Demo complete.' : 'Thank you.', `${result.message}${result.reference ? ` Reference: ${result.reference}.` : ''}`);
      } else {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([name, msg]) => {
            const el = form.querySelector<Control>(`[name="${name}"]`);
            if (el) setError(el, msg);
          });
        }
        showStatus('error', 'Your submission was not sent.', result.message);
      }
    });
    // Preview markup has a non-submitting button until its JS handler exists.
    // Without JS, sample details cannot be sent as a native form GET request.
    if (isPreview && submitBtn) submitBtn.type = 'submit';
  });
}
