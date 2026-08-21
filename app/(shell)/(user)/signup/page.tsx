import SignupForm from "@/components/signup-form";

export default function Page() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-5 py-10 md:px-10 md:py-20">
      <div className="w-full max-w-[440px]">
        <SignupForm />
      </div>
    </div>
  );
}