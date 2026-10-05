/** Default text for new proposals and contracts. Edit freely; {{client}}, {{project}} and {{business}} are replaced. */

export const PROPOSAL_TEMPLATE = `## Overview

Thank you for considering {{business}} for {{project}}. This proposal outlines the scope, timeline and investment for the work.

## Scope of work

- Discovery call and content gathering
- Custom design for up to 5 pages (home, about, services, contact, + 1)
- Mobile-responsive build
- Basic on-page SEO setup
- One round of revisions per page
- Launch and 30 days of post-launch support

## Timeline

- Week 1: Discovery and sitemap
- Weeks 2–3: Design
- Weeks 4–5: Build and content
- Week 6: Review, revisions and launch

## Investment

See total below. 50% deposit to begin, 50% on launch.

## Next steps

Accept this proposal below and I'll send over the contract and deposit invoice to get started.`;

export const CONTRACT_TEMPLATE = `## Website Design & Development Agreement

This agreement is between {{business}} ("Designer") and {{client}} ("Client") for the project "{{project}}".

### 1. Services
Designer will design and develop the website described in the accepted proposal. Work outside that scope will be quoted separately.

### 2. Payment
A 50% deposit is due before work begins. The remaining 50% is due before the site goes live. Invoices are payable within 7 days.

### 3. Content
Client will provide all text, images and brand assets. Delays in providing content may extend the timeline.

### 4. Revisions
Each page includes one round of revisions. Additional revisions are billed hourly.

### 5. Ownership
On final payment, Client owns the finished website. Designer retains the right to display the work in a portfolio.

### 6. Cancellation
Either party may cancel in writing. The deposit is non-refundable; work completed beyond the deposit will be billed.

### 7. Agreement
By signing below, both parties agree to the terms above.`;

export function fillTemplate(
  template: string,
  vars: { client: string; project: string; business: string }
) {
  return template
    .replaceAll("{{client}}", vars.client)
    .replaceAll("{{project}}", vars.project)
    .replaceAll("{{business}}", vars.business);
}
