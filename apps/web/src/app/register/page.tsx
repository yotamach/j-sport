import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main style={{ padding: "64px 48px", display: "flex", justifyContent: "center" }}>
      <AuthForm mode="register" />
    </main>
  );
}
