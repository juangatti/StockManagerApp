// Frontend/src/pages/ProfilePage.jsx
import ProfileForm from "../components/organisms/ProfileForm";

export default function ProfilePage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary mb-6 font-display uppercase tracking-wide">
        Mi Perfil
      </h2>
      <ProfileForm />
    </div>
  );
}
