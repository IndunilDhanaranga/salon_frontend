"use client";

import { useRouter } from "next/navigation";
import { AuthScreen } from "@/features/auth";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthScreen
      initialRegister={true}
      onAuthenticated={() => {
        router.push("/");
      }}
    />
  );
}
