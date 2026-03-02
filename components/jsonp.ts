export function jsonp<T>(url: string, timeoutMs = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `__jsonp_cb_${Math.random().toString(36).slice(2)}`;
    const hasQuery = url.includes('?');
    const fullUrl = `${url}${hasQuery ? '&' : '?'}callback=${encodeURIComponent(callbackName)}`;

    const script = document.createElement('script');
    let timer: number | undefined;

    function cleanup() {
      if (timer) window.clearTimeout(timer);
      delete (window as any)[callbackName];
      script.remove();
    }

    (window as any)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.src = fullUrl;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP 載入失敗'));
    };

    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('JSONP 逾時'));
    }, timeoutMs);

    document.head.appendChild(script);
  });
}
