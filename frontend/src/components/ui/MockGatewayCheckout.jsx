import { useMemo, useState } from 'react';
import Card from './Card';
import Button from './Button';
import { formatINR } from '../../utils/currency';

function buildReceiptContent({ order, paymentId, receiptId, purpose }) {
  const amount = formatINR((Number(order?.amount) || 0) / 100);
  return [
    'Contractual - Mock Payment Receipt',
    `Receipt: ${receiptId}`,
    `Purpose: ${purpose === 'tip' ? 'Tip Payment' : 'Escrow Funding'}`,
    `Order ID: ${order?.id || '-'}`,
    `Payment ID: ${paymentId || '-'}`,
    `Amount: ${amount}`,
    `Currency: ${order?.currency || 'INR'}`,
    `Date: ${new Date().toLocaleString('en-IN')}`,
  ].join('\n');
}

export default function MockGatewayCheckout({
  open,
  order,
  purpose,
  processing = false,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState('details');
  const [method, setMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMeta, setSuccessMeta] = useState(null);

  const amountLabel = useMemo(
    () => formatINR((Number(order?.amount) || 0) / 100),
    [order?.amount],
  );

  if (!open || !order) return null;

  const resetStateAndClose = () => {
    setStep('details');
    setMethod('card');
    setUpiId('');
    setBankName('HDFC Bank');
    setOtp('');
    setError('');
    setSuccessMeta(null);
    onClose();
  };

  const onProceedOtp = () => {
    setStep('otp');
    setError('');
  };

  const onPay = async () => {
    try {
      setError('');
      if (otp.trim() !== '123456') {
        setStep('failed');
        setError('Invalid OTP. Use 123456 in test mode.');
        return;
      }

      const result = await onConfirm({ otp });
      const paymentId = result?.paymentId || `mock_pay_${Date.now()}`;
      const receiptId = result?.receiptId || `MRCPT-${Date.now()}`;
      setSuccessMeta({ paymentId, receiptId });
      setStep('success');
    } catch (err) {
      setStep('failed');
      setError(err?.response?.data?.error || err?.message || 'Payment failed. Please retry.');
    }
  };

  const downloadReceipt = () => {
    if (!successMeta) return;
    const content = buildReceiptContent({
      order,
      paymentId: successMeta.paymentId,
      receiptId: successMeta.receiptId,
      purpose,
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${successMeta.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mock-overlay" role="dialog" aria-modal="true" aria-label="Mock payment checkout">
      <Card className="mock-checkout">
        <div className="mock-head">
          <div>
            <p className="mock-kicker">Secure Checkout</p>
            <h3 className="section-title">MockPay</h3>
          </div>
          <span className="payment-pill payment-pill-funded">Test Mode</span>
        </div>

        {step === 'details' && (
          <>
            <div className="mock-amount">
              <p className="muted">{purpose === 'tip' ? 'Tip Amount' : 'Escrow Amount'}</p>
              <strong>{amountLabel}</strong>
            </div>

            <div className="mock-methods">
              <button type="button" className={`mock-method${method === 'card' ? ' mock-method-active' : ''}`} onClick={() => setMethod('card')}>Card</button>
              <button type="button" className={`mock-method${method === 'upi' ? ' mock-method-active' : ''}`} onClick={() => setMethod('upi')}>UPI</button>
              <button type="button" className={`mock-method${method === 'netbanking' ? ' mock-method-active' : ''}`} onClick={() => setMethod('netbanking')}>Netbanking</button>
            </div>

            {method === 'card' && (
              <div className="grid">
                <input className="input" value="4111 1111 1111 1111" readOnly />
                <div className="grid grid-2">
                  <input className="input" value="12/30" readOnly />
                  <input className="input" value="123" readOnly />
                </div>
                <input className="input" value="Test User" readOnly />
              </div>
            )}
            {method === 'upi' && (
              <div className="grid">
                <input
                  className="input"
                  placeholder="Enter UPI ID (eg: name@okaxis)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="muted">Test mode: any valid-looking UPI ID is accepted.</p>
              </div>
            )}
            {method === 'netbanking' && (
              <div className="grid">
                <select className="select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India</option>
                  <option>Axis Bank</option>
                </select>
                <p className="muted">You selected: {bankName}</p>
              </div>
            )}

            <div className="row">
              <Button variant="secondary" onClick={resetStateAndClose} disabled={processing}>Cancel</Button>
              <Button
                variant="primary"
                onClick={onProceedOtp}
                disabled={processing || (method === 'upi' && !upiId.trim())}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="muted">Enter OTP to authorize payment (Test OTP: <strong>123456</strong>).</p>
            <input
              className="input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={processing}
            />
            {error && <p className="field-error">{error}</p>}
            <div className="row">
              <Button variant="secondary" onClick={() => setStep('details')} disabled={processing}>Back</Button>
              <Button variant="primary" onClick={onPay} loading={processing} loadingText="Processing...">
                Pay {amountLabel}
              </Button>
            </div>
          </>
        )}

        {step === 'failed' && (
          <>
            <p className="field-error">{error || 'Payment failed.'}</p>
            <div className="row">
              <Button variant="secondary" onClick={() => setStep('otp')}>Retry</Button>
              <Button variant="secondary" onClick={resetStateAndClose}>Close</Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <p className="alert alert-success">Payment successful</p>
            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <p className="detail-meta-label">Receipt</p>
                <p className="detail-meta-value">{successMeta?.receiptId}</p>
              </div>
              <div className="detail-meta-item">
                <p className="detail-meta-label">Payment ID</p>
                <p className="detail-meta-value">{successMeta?.paymentId}</p>
              </div>
            </div>
            <div className="row">
              <Button variant="secondary" onClick={downloadReceipt}>Download Receipt</Button>
              <Button variant="primary" onClick={resetStateAndClose}>Done</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
