import React, { useEffect } from 'react';

// DRAFT starting point, not legal advice: have these reviewed before taking live payments.
const CONTACT = 'support@cuserents.com';
const UPDATED = 'October 2026';

const TERMS = [
  ['What CuseRents is', 'CuseRents is a marketplace that connects people who want to rent everyday items ("renters") with people who own them ("owners"). CuseRents is not a party to rentals and does not own, inspect, or insure listed items.'],
  ['Accounts', 'You must be at least 18 and give accurate information. You are responsible for activity on your account. We may suspend accounts that break these terms.'],
  ['Payments', 'Payments are processed by Stripe. When you request a booking, your card is authorized for the rental fee plus the security deposit. The rental fee is charged when the owner confirms the item was returned; the deposit hold is then released unless the owner reports damage, in which case the deposit is charged. Owners receive the rental fee minus the CuseRents platform fee through their Stripe account and must complete Stripe onboarding to be paid. Use of Stripe is subject to the Stripe Services Agreement.'],
  ['Cancellations', 'Renters may cancel before pickup and the card authorization is released. Owners may decline requests. Authorizations expire after about 7 days, so rentals must end within 6 days of booking.'],
  ['Owner responsibilities', 'Owners must have the right to rent their items, describe them accurately, and keep them safe to use. Report damage honestly; false damage claims may lead to account suspension and refunds.'],
  ['Renter responsibilities', 'Renters must use items with care, return them on time and in the same condition, and follow any safety instructions.'],
  ['Prohibited items', 'No weapons, illegal items, hazardous materials, vehicles, or anything requiring a license to operate.'],
  ['Liability', 'CuseRents is provided "as is". To the extent allowed by law, CuseRents is not liable for loss, injury, or damage arising from rentals between users.'],
  ['Changes', 'We may update these terms; continued use after an update means you accept it.'],
];

const PRIVACY = [
  ['What we collect', 'Name, email, username, and optional phone number; item listings including addresses, coordinates, and photos; bookings, reviews, and reward points. Card details are entered directly into Stripe and never reach our servers.'],
  ['How we use it', 'To run the marketplace: show listings and distances, process bookings, send booking emails, calculate ratings and rewards, and prevent fraud.'],
  ['Who we share it with', 'Stripe (payments and owner payouts), Cloudinary (photo hosting), Google Maps (address lookup), and our email provider. Renters see an owner\'s username, rating, and item address; owners see the renter\'s name and contact details for their bookings. We do not sell personal data.'],
  ['Storage and security', 'Data is stored with our hosting provider and sent over HTTPS. Login sessions use expiring tokens.'],
  ['Your choices', `You can edit your profile and listings at any time. To delete your account or get a copy of your data, email ${CONTACT}.`],
  ['Changes', 'We will post updates to this page with a new date.'],
];

const LegalPage = ({ kind, onBack }) => {
  const isTerms = kind === 'terms';
  useEffect(() => { window.scrollTo(0, 0); }, [kind]);  // opened from the footer, so start at the top
  return (
    <div className="legal-page">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h1>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</h1>
      <p className="legal-updated">Last updated {UPDATED}</p>
      {(isTerms ? TERMS : PRIVACY).map(([heading, text]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{text}</p>
        </section>
      ))}
      <p>Questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </div>
  );
};

export default LegalPage;
