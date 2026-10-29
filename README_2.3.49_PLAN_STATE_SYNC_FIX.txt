Snip 2.3.49 plan-state synchronization fix

Changes:
- Removed the hard-coded Free exhausted message from the regular extension popup.
- The plan-panel copy now reflects the current verified usage/entitlement response.
- The regular popup re-checks usage every 5 seconds and when focus/visibility returns, updating current-plan styling.
- The PDF plan buttons label the verified current plan explicitly and use the actual plan to determine whether Free or Pro searches are exhausted.
- Website source files were not edited.

Validation: JavaScript syntax and manifest JSON validation passed. Live Chrome/payment-provider behavior still requires manual testing.
