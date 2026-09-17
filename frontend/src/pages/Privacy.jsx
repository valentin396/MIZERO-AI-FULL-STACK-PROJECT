export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-4">Privacy Policy</h1>
      <p className="text-ink/70 leading-relaxed mb-4">
        MIZERO is a graduation project, not a commercial company. This policy explains, in plain
        language, what data we collect and how it's used.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">What we collect.</strong> When you create an account, we
        store your name, email address, and a password. When you file a report, we store the
        item details you provide — title, description, category, location, date, and an optional
        photo.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Passwords.</strong> Your password is never stored in plain
        text. It's hashed with bcrypt before it touches our database, so even we can't read it
        back.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Contact info.</strong> Your phone number or email is only
        shared with another user after a match between your report and theirs has been confirmed
        by both sides. It is never shown publicly on a listing.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">No guarantees.</strong> MIZERO uses automated matching to
        suggest possible connections between lost and found reports, but there is no guarantee
        that a lost item will be recovered or that a suggested match is correct.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Cookies and local storage.</strong> MIZERO doesn't use
        third-party tracking or advertising cookies. Your browser's local storage is used only to
        keep you signed in and to remember your preferred language — nothing here is sold or
        shared with advertisers.
      </p>
      <p className="text-ink/70 leading-relaxed mb-4">
        <strong className="text-ink">Deleting your data.</strong> You can request that your
        account and report data be deleted at any time via the{' '}
        <a href="/contact" className="text-clay hover:underline">contact page</a>. We'll remove
        it within a reasonable time, except where a report is still tied to an active match
        another user is relying on.
      </p>
      <p className="text-ink/70 leading-relaxed">
        This project was built for academic purposes. If you have questions about your data,
        reach out via the <a href="/contact" className="text-clay hover:underline">contact page</a>.
      </p>
    </div>
  );
}
