import { useAuth } from "../auth/useAuth";

function AccountPage() {
  const { user } = useAuth();

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Personal account</p>
          <h1 className="page-title">Profile / Account</h1>
          <p className="page-description">
            View the account information currently stored for your WatchDog account.
          </p>
        </div>
      </div>

      <section className="card settings-card account-profile-card" aria-labelledby="account-profile-title">
        <div className="card-heading">
          <div>
            <h2 id="account-profile-title">Account information</h2>
            <p>These details are read-only because profile editing is not available yet.</p>
          </div>
        </div>
        <dl className="account-profile-details">
          <div>
            <dt>Email</dt>
            <dd>{user?.email ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt>Account created</dt>
            <dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unavailable"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

export default AccountPage;
