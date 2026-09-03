export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-semibold mb-4">About MIZERO</h1>
      <p className="text-ink/70 leading-relaxed mb-4">
        MIZERO — Kinyarwanda for "zero," as in zero lost items left unclaimed — is a graduation
        project built as a conversational, AI-assisted lost-and-found platform for Rwanda.
      </p>
      <p className="text-ink/70 leading-relaxed">
        The matching engine is built from scratch — TF-IDF text similarity, perceptual image
        hashing, and date/category/location signals — so every suggested match can be explained
        in plain language, not just handed down as an opaque score.
      </p>
    </div>
  );
}
