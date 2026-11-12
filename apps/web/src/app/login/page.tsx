import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main style={{ padding: "64px 48px", display: "flex", justifyContent: "center" }}>
      <AuthForm mode="login" />
    </main>
  );
}
