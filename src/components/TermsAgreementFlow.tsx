import { useState } from 'react';
import './TermsAgreementFlow.css';

const TermsAgreementFlow = () => {
  const [agreed, setAgreed] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      console.log('Terms accepted');
      // Handle acceptance logic here
    }
  };

  const handleReject = () => {
    console.log('Terms rejected');
    // Handle rejection logic here
  };

  return (
    <div className="terms-container">
      <h1 className="terms-title">Terms And Conditions</h1>
      
      <div className="terms-box">
        <h2 className="terms-box-title">Transaction Terms & Conditions</h2>
        
        <div className="terms-content">
          <ol className="terms-list">
            <li>Funds will be held in escrow until services are completed.</li>
            <li>Payment will be released upon mutual confirmation.</li>
            <li>Disputes will be resolved under South African law.</li>
            <li>Neither party may modify terms after acceptance</li>
          </ol>
          
              <button 
            className="view-more-btn"
            onClick={() => {
              // toggle full terms, and clear agreement if hiding them
              setShowFullTerms((prev) => {
                const next = !prev;
                if (!next) {
                  setAgreed(false);
                }
                return next;
              });
            }}
          >
            {showFullTerms ? '...view less' : '...view more'}
          </button>

          {showFullTerms && (
            <div className="additional-terms">
              <p>
                5. All communications must be made through this platform.
              </p>
              <p>
                6. Either party may escalate disputes to our resolution team.
              </p>
              <p>
                7. Fees apply as per the pricing agreement.
              </p>
              <p>
                8. Termination requires written notice by either party.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="agreement-section">
        <div className="checkbox-container">
          <input
            type="checkbox"
            id="agreement-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="agreement-checkbox"
            disabled={!showFullTerms}
          />
          <label htmlFor="agreement-checkbox" className="agreement-label">
            I have read and agree to the T's & C's of this escrow agreement.
          </label>
        </div>

        <div className="button-group">
          <button
            className="btn btn-accept"
            onClick={handleAccept}
            disabled={!agreed}
          >
            Accept
          </button>
          <button
            className="btn btn-reject"
            onClick={handleReject}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAgreementFlow;
