import React, { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode || 'login')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Registration fields
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('SOC Analyst')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Keep internal mode synced with context mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [authModalMode, isAuthModalOpen])

  if (!isAuthModalOpen) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)
    try {
      await login({
        username_or_email: usernameOrEmail,
        password,
      })
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)
    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        role: regRole,
      })
      setSuccessMessage('Account created and registered in database!')
    } catch (err: any) {
      setErrorMessage(err?.data?.detail || err?.message || 'Registration failed. Check if username/email exists.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoAccount = () => {
    setUsernameOrEmail('analyst_koushik')
    setPassword('SecOpsPassword2026!')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0B0E14] border border-[#1E2638] rounded-xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1 text-[#64748B] hover:text-[#F1F5F9] rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="inline-flex p-2.5 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
            {mode === 'login' ? 'SOC Analyst Sign In' : 'Create Analyst Account'}
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            {mode === 'login'
              ? 'Authenticate to access autonomous payment security controls'
              : 'Register credentials into the persistent security database'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#11151F] border border-[#1E2638] rounded-lg p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setErrorMessage(null)
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors text-center font-medium ${
              mode === 'login'
                ? 'bg-[#182030] text-[#06B6D4] font-semibold shadow-xs'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setErrorMessage(null)
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors text-center font-medium ${
              mode === 'register'
                ? 'bg-[#182030] text-[#06B6D4] font-semibold shadow-xs'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Alert / Error Banners */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#EF4444] animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-2.5 text-xs text-[#10B981] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Username or Email:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  required
                  placeholder="analyst_koushik or email@domain.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg pl-9 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg pl-9 pr-9 py-2 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-[11px] font-mono text-[#06B6D4] hover:underline"
              >
                Auto-fill Demo Account
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-[#06B6D4] hover:bg-[#06B6D4]/90 text-[#07090E] font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#94A3B8] block">
                  Username:
                </label>
                <input
                  type="text"
                  required
                  placeholder="analyst_jane"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg px-3 py-1.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#94A3B8] block">
                  Full Name:
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg px-3 py-1.5 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Email Address:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  required
                  placeholder="jane.doe@enterprise.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg pl-9 pr-3 py-1.5 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Role / Clearance:
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="SOC Analyst">SOC Analyst</option>
                <option value="Lead Security Engineer">Lead Security Engineer</option>
                <option value="Financial Risk Officer">Financial Risk Officer</option>
                <option value="Compliance Auditor">Compliance Auditor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#94A3B8] block">
                Password:
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-[#11151F] border border-[#1E2638] focus:border-[#06B6D4] text-xs font-mono text-[#F1F5F9] rounded-lg px-3 py-1.5 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-[#07090E] font-semibold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isLoading ? 'Creating Account...' : 'Register Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
