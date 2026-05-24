import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || 'JSP@ADMIN2024'

const bg = '#06080f'
const card = '#101828'
const orange = '#f97316'
const inp = {
  width: '100%',
  padding: 12,
  marginBottom: 10,
  background: '#162032',
  border: '1px solid #1e2d45',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  boxSizing: 'border-box'
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', code: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  async function handleAuth() {
    setErr('')
    setBusy(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })
      if (error) setErr(error.message)
    } else {
      if (!form.name || !form.phone) {
        setErr('Name and phone are required')
        setBusy(false)
        return
      }
      const isAdmin = form.code === ADMIN_CODE
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.phone,
            role: isAdmin ? 'admin' : 'candidate'
          }
        }
      })
      if (error) setErr(error.message)
      else if (data.session) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.name,
          phone: form.phone,
          role: isAdmin ? 'admin' : 'candidate'
        })
      }
    }
    setBusy(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        Loading...
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui' }}>
        <div style={{ width: '100%', maxWidth: 400, background: card, padding: 30, borderRadius: 12, border: '1px solid #1e2d45' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: 22 }}>JanaSena Portal</h1>
            <div style={{ color: '#5a7090', fontSize: 12, marginTop: 4 }}>Candidate Screening</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setMode('login')} style={{ flex: 1, padding: 10, background: mode === 'login' ? orange : '#162032', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
            <button onClick={() => setMode('signup')} style={{ flex: 1, padding: 10, background: mode === 'signup' ? orange : '#162032', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Sign Up</button>
          </div>
          {err && <div style={{ background: '#1c0505', color: '#fca5a5', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{err}</div>}
          {mode === 'signup' && (
            <>
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
          <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} />
          {mode === 'signup' && (
            <input placeholder="Admin Code (optional)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} style={inp} />
          )}
          <button onClick={handleAuth} disabled={busy} style={{ width: '100%', padding: 12, background: orange, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
            {busy ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: 20, fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Welcome, {profile?.full_name || session.user.email}</h1>
            <div style={{ color: '#5a7090', fontSize: 12, marginTop: 4 }}>Role: {profile?.role || 'candidate'}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px', background: orange, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Sign Out</button>
        </div>
        <div style={{ background: card, padding: 24, borderRadius: 8, border: '1px solid #1e2d45' }}>
          <h2 style={{ marginTop: 0, color: orange }}>🎉 Login Successful!</h2>
          <p>Email: {session.user.email}</p>
          <p>Role: {profile?.role || 'candidate'}</p>
          <p style={{ color: '#5a7090', fontSize: 13 }}>The full screening dashboard will be added next.</p>
        </div>
      </div>
    </div>
  )
}