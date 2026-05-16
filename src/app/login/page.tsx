import { LoginForm } from './login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Finanti</h1>
          <p className="text-[#94A3B8] text-sm">Tu panel financiero personal</p>
        </div>
        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  )
}
