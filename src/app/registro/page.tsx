import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout fixedLogo>
      <RegisterForm />
    </AuthLayout>
  );
}
