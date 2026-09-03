import { useAuth } from '../services/auth.jsx';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="px-8 py-8 max-w-md">
      <h1 className="text-2xl font-semibold mb-1">Profile</h1>
      <p className="text-ink/60 mb-8">Your account details.</p>
      <div className="border border-ink/15 bg-cream p-6 space-y-4">
        <Field label="Name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone} />
        <Field label="Role" value={user.role} />
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink/50 uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
