import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { KeyRound, MountainSnow, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #FFF3DB 0%, #FFE4B5 25%, #FFD08A 50%, #FFBC5E 75%, #FFF0DB 100%)'
         }}>
      {/* Decorative floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-brand-300/40 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-brand-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand-100/50 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-10 right-1/3 w-48 h-48 bg-pastel-peach/60 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      {/* Majestic Mountain Landscape */}
      <div className="absolute bottom-0 left-0 w-full h-[45vh] pointer-events-none opacity-60">
        <div className="absolute bottom-0 left-[15%] w-[80%] h-[120%] bg-gradient-to-b from-brand-200/80 to-brand-400/40" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', filter: 'blur(2px)' }} />
        <div className="absolute bottom-0 left-[-20%] w-[70%] h-[90%] bg-gradient-to-b from-brand-400/90 to-brand-500/50" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute bottom-0 right-[-15%] w-[65%] h-[100%] bg-gradient-to-b from-brand-500/80 to-brand-600/60" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-4xl shadow-glass-lg border border-white/80 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent pointer-events-none" />
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 text-white mb-5 shadow-pastel-lg"
            >
              <MountainSnow size={36} />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="text-2xl font-display font-extrabold tracking-wide text-gradient"
            >
              JOSHI GUEST HOUSE
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="text-gray-400 mt-2 text-xs font-semibold uppercase tracking-[0.25em]"
            >
              Management Portal
            </motion.p>
          </div>
          
          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-pastel-rose/60 text-rose-700 p-4 rounded-2xl text-sm font-medium border border-rose-200/50"
                >
                  {error}
                </motion.div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" />
                  <input
                    type="email"
                    required
                    className="input-field pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joshiguesthouse@gmail.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" />
                  <input
                    type="password"
                    required
                    className="input-field pl-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn-brand w-full flex items-center justify-center space-x-2"
              >
                <KeyRound size={18} />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
