export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-4">Terms of Use</h1>
      <p className="text-ink/70 leading-relaxed mb-4">
        MIZERO is a graduation project built to explore AI-assisted matching for lost-and-found
        reports in Rwanda. It is not a registered business or a law-enforcement service, and
        using it means accepting the following.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Accuracy of reports.</strong> Please only submit honest,
        accurate reports of items you have genuinely lost or found. Fake reports make the
        platform less useful for everyone.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">No guarantee of recovery.</strong> MIZERO's matching engine
        suggests possible connections based on text, location, time, image, and category
        similarity, but it cannot guarantee that any lost item will be found or returned, nor
        that a suggested match is the correct one.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Contact info stays private.</strong> Contact details are
        only exchanged between two users after a match is confirmed by both sides — never
        published on a public listing.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Not liable for disputes or failed recoveries.</strong>
        MIZERO acts only as a matching tool. We are not liable if an item is never recovered, if
        a suggested match turns out to be wrong, or for anything that happens during an exchange,
        meetup, or ownership verification between users — that responsibility is theirs alone.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Account termination.</strong> We may suspend or delete an
        account that posts fake reports, harasses other users, or otherwise misuses the
        platform, without prior notice.
      </p>
      <p className="text-ink/70 leading-relaxed">
        Since this is a student project, features and data may change or be reset without
        notice as the platform continues to be developed.
      </p>
    </div>
  );
}
