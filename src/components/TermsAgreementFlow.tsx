import { useState } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface TermsAgreementFlowProps {
  onAccept?: () => void | Promise<void>;
  onReject?: () => void;
}

const TermsAgreementFlow = ({ onAccept, onReject }: TermsAgreementFlowProps) => {
  const [agreed, setAgreed] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (agreed) {
      setIsProcessing(true);
      try {
        if (onAccept) {
          await onAccept();
        }
      } catch (error) {
        console.error('Error accepting terms:', error);
        setIsProcessing(false);
      }
    }
  };

  const handleReject = () => {
    setIsProcessing(false);
    if (onReject) {
      onReject();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-8 py-8 md:px-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-8 h-8" />
          <h1 className="text-3xl md:text-2xl font-bold">
            Terms & Conditions
          </h1>
        </div>
        <p className="opacity-90 text-sm">
          Please review and accept our escrow agreement terms before proceeding
        </p>
      </div>

      {/* Content */}
      <div className="px-8 py-8 md:px-6">
        {/* Summary Box */}
        <div className="bg-secondary border border-border rounded-xl p-5 mb-8">
          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            What you're agreeing to:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Secure escrow protection for all transactions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Fair dispute resolution under South African law</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">•</span>
              <span>Transparent fees and payment terms</span>
            </li>
          </ul>
        </div>

        {/* Terms Box with Scroll */}
        <div className="bg-secondary border border-border rounded-xl p-6 mb-8">
          <h2 className="text-foreground text-lg font-semibold mb-5">
            Transaction Terms & Conditions
          </h2>
          
          <ol className="space-y-5 text-foreground text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="text-accent font-semibold flex-shrink-0 w-5">1.</span>
              <span>Funds will be held in escrow until services are completed.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-semibold flex-shrink-0 w-5">2.</span>
              <span>Payment will be released upon mutual confirmation.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-semibold flex-shrink-0 w-5">3.</span>
              <span>Disputes will be resolved under South African law.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-semibold flex-shrink-0 w-5">4.</span>
              <span>Neither party may modify terms after acceptance.</span>
            </li>

            {showFullTerms && (
              <>
                <li className="flex gap-3 border-t border-border pt-5">
                  <span className="text-accent font-semibold flex-shrink-0 w-5">5.</span>
                  <span>All communications must be made through this platform.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold flex-shrink-0 w-5">6.</span>
                  <span>Either party may escalate disputes to our resolution team.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold flex-shrink-0 w-5">7.</span>
                  <span>Fees apply as per the pricing agreement.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-semibold flex-shrink-0 w-5">8.</span>
                  <span>Termination requires written notice by either party.</span>
                </li>
              </>
            )}
          </ol>
          
          <button 
            className="text-primary hover:text-primary/80 text-sm font-semibold mt-5 flex items-center gap-1 transition-colors duration-300"
            onClick={() => setShowFullTerms(!showFullTerms)}
          >
            {showFullTerms ? 'Show less' : 'Show more'}
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-300 ${showFullTerms ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-3 mb-8 p-4 bg-secondary rounded-xl hover:bg-secondary hover:opacity-80 transition-all duration-200">
          <input
            type="checkbox"
            id="agreement-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-2 border-border cursor-pointer accent-primary flex-shrink-0"
          />
          <label 
            htmlFor="agreement-checkbox" 
            className="text-foreground text-sm leading-relaxed cursor-pointer flex-1"
          >
            I have carefully read and agree to all the <span className="font-semibold">Terms & Conditions</span> for this escrow agreement. I understand my rights and obligations as outlined above.
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center md:flex-col">
          <button
            className={`flex-1 md:w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              agreed && !isProcessing
                ? 'bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={handleAccept}
            disabled={!agreed || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                I Accept
              </>
            )}
          </button>
          <button
            className="flex-1 md:w-full px-6 py-3 font-semibold rounded-lg transition-all duration-300 bg-muted text-foreground hover:bg-muted hover:opacity-80 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border border-border"
            onClick={handleReject}
            disabled={isProcessing}
          >
            Decline
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By accepting, you agree to our terms and are ready to proceed with your transaction.
        </p>
      </div>
    </div>
  );
};

export default TermsAgreementFlow;