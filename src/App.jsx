import { useEffect, useMemo, useState } from 'react'
import './App.css'

const ADMIN_EMAIL = 'admin@businesslabs.com'
const ADMIN_PASSWORD = 'admin123'
const STORAGE_KEY = 'businesslabs_students'
const SESSION_KEY = 'businesslabs_session'

const qualifications = ['High School', 'Bachelors', "Master's", 'Diploma', 'Other']
const interestsList = ['Coding', 'Design', 'Gaming', 'Sports']
const emptySignup = {
  name: '',
  email: '',
  password: '',
  dob: '',
  gender: '',
  qualification: '',
  interests: [],
  className: '',
  subject: '',
  marks: '',
  aadhaarFile: null,
}

const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQwXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyMSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9Sb290IDEgMCBSIC9TaXplIDQgPj4Kc3RhcnR4cmVmCjIwOQolJUVPRg=='

const starterStudents = [
  {
    id: 1,
    userId: 'STU001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'student123',
    dob: '1994-03-20',
    gender: 'Male',
    qualification: "Bachelor's",
    interests: ['Coding', 'Design', 'Gaming', 'Sports'],
    className: 'form-control',
    subject: 'form-control',
    marks: '1200',
    aadhaarName: 'aadhaar_STU001_sample.pdf',
    aadhaarData: samplePdf,
    createdAt: new Date().toISOString(),
  },
]

function getStoredStudents() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterStudents))
    return starterStudents
  }
  return JSON.parse(saved)
}

function saveStoredStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

function getSession() {
  const saved = localStorage.getItem(SESSION_KEY)
  return saved ? JSON.parse(saved) : null
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function calculateAge(dateText) {
  if (!dateText) return ''
  const birth = new Date(dateText)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

function formatDate(dateText) {
  if (!dateText) return ''
  const [year, month, day] = dateText.split('-')
  return `${day}/${month}/${year}`
}

function makeFileName(userId, originalName) {
  const part = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  const clean = originalName.replace(/[^a-zA-Z0-9.]/g, '_')
  return `aadhaar_${userId}_${time}_${part}_${clean}`
}

function readPdfFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      reject(new Error('Aadhaar document must be a PDF file.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read selected file.'))
    reader.readAsDataURL(file)
  })
}

function Header({ view, setView, session, logout }) {
  const title = session?.role === 'admin' ? 'Admin Dashboard' : session?.role === 'student' ? 'Student Dashboard' : 'Unified Login'
  return (
    <header className="topbar">
      <div className="nav-inner">
        <h1>{title}</h1>
        <nav>
          <button className={view === 'home' ? 'nav-active' : ''} onClick={() => setView('home')}>Home</button>
          <button className={view === 'signup' ? 'nav-active' : ''} onClick={() => setView('signup')}>Signup</button>
          <button className={view === 'login' ? 'nav-active' : ''} onClick={() => setView('login')}>Login</button>
        </nav>
        {session && <button className="logout" onClick={logout}>Logout</button>}
      </div>
    </header>
  )
}

function Home({ setView }) {
  return (
    <main className="page home-page">
      <section className="home-panel">
        <h2>Students Registration Forms</h2>
        <p>Register student details, login from one screen, and manage student records from a protected admin panel.</p>
        <div className="home-actions">
          <button className="btn primary" onClick={() => setView('signup')}>Student Signup</button>
          <button className="btn" onClick={() => setView('login')}>Account Login</button>
        </div>
        <p className="hint">Admin login: admin@businesslabs.com / admin123</p>
        <p className="hint">Sample student: john.doe@example.com / student123</p>
      </section>
    </main>
  )
}

function Signup({ students, setStudents, setView }) {
  const [form, setForm] = useState(emptySignup)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setMessage('')
  }

  function toggleInterest(value) {
    setForm((current) => {
      const exists = current.interests.includes(value)
      return {
        ...current,
        interests: exists ? current.interests.filter((item) => item !== value) : [...current.interests, value],
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const duplicate = students.some((student) => student.email.toLowerCase() === form.email.trim().toLowerCase())
    if (duplicate) {
      setError('This email is already registered.')
      return
    }

    try {
      const fileData = await readPdfFile(form.aadhaarFile)
      const nextId = students.length ? Math.max(...students.map((student) => student.id)) + 1 : 1
      const userId = `STU${String(nextId).padStart(3, '0')}`
      const newStudent = {
        id: nextId,
        userId,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        dob: form.dob,
        gender: form.gender,
        qualification: form.qualification,
        interests: form.interests,
        className: form.className.trim(),
        subject: form.subject.trim(),
        marks: form.marks,
        aadhaarName: makeFileName(userId, form.aadhaarFile.name),
        aadhaarData: fileData,
        createdAt: new Date().toISOString(),
      }
      const updated = [...students, newStudent]
      setStudents(updated)
      saveStoredStudents(updated)
      setForm(emptySignup)
      event.target.reset()
      setMessage('Registration completed successfully. Please login.')
      setTimeout(() => setView('login'), 900)
    } catch (uploadError) {
      setError(uploadError.message)
    }
  }

  return (
    <main className="page">
      <form className="form-card wide" onSubmit={handleSubmit}>
        <div className="card-title">Student Signup Form</div>
        <div className="form-grid">
          <label>Name<input required value={form.name} onChange={(e) => updateField('name', e.target.value)} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></label>
          <label>Password<input required minLength="4" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} /></label>
          <label>Date of Birth<input required type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} /></label>
          <fieldset>
            <legend>Gender</legend>
            <label className="choice"><input required type="radio" name="gender" value="Male" onChange={(e) => updateField('gender', e.target.value)} /> Male</label>
            <label className="choice"><input type="radio" name="gender" value="Female" onChange={(e) => updateField('gender', e.target.value)} /> Female</label>
            <label className="choice"><input type="radio" name="gender" value="Other" onChange={(e) => updateField('gender', e.target.value)} /> Other</label>
          </fieldset>
          <label>Qualification<select required value={form.qualification} onChange={(e) => updateField('qualification', e.target.value)}><option value="">Select Qualification</option>{qualifications.map((item) => <option key={item}>{item}</option>)}</select></label>
          <fieldset className="full-line">
            <legend>Interests</legend>
            {interestsList.map((item) => <label className="choice" key={item}><input type="checkbox" checked={form.interests.includes(item)} onChange={() => toggleInterest(item)} /> {item}</label>)}
          </fieldset>
          <label>Class<input required value={form.className} onChange={(e) => updateField('className', e.target.value)} /></label>
          <label>Subject<input required value={form.subject} onChange={(e) => updateField('subject', e.target.value)} /></label>
          <label>Marks<input required min="0" type="number" value={form.marks} onChange={(e) => updateField('marks', e.target.value)} /></label>
          <label>Aadhaar Document<input required accept="application/pdf,.pdf" type="file" onChange={(e) => updateField('aadhaarFile', e.target.files[0])} /></label>
        </div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <button className="btn primary full" type="submit">Create Account</button>
      </form>
    </main>
  )
}

function Login({ students, setSession, setView }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(event) {
    event.preventDefault()
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const session = { role: 'admin', email: ADMIN_EMAIL }
      saveSession(session)
      setSession(session)
      setView('admin')
      return
    }
    const student = students.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password)
    if (student) {
      const session = { role: 'student', email: student.email, id: student.id }
      saveSession(session)
      setSession(session)
      setView('student')
      return
    }
    setError('Invalid email or password.')
  }

  return (
    <main className="page login-page">
      <form className="form-card login-card" onSubmit={handleLogin}>
        <div className="card-title">Account Login</div>
        <label>Email Address<input required type="email" placeholder="Email Address (email)" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input required type="password" placeholder="Password (password)" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="button" className="link-button" onClick={() => setView('forgot')}>Forgot Password?</button>
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary full" type="submit">Login</button>
      </form>
    </main>
  )
}

function ForgotPassword({ students, setStudents, setView }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleReset(event) {
    event.preventDefault()
    const found = students.some((student) => student.email.toLowerCase() === email.toLowerCase())
    if (!found) {
      setError('No account found with this email.')
      return
    }
    const updated = students.map((student) => student.email.toLowerCase() === email.toLowerCase() ? { ...student, password } : student)
    setStudents(updated)
    saveStoredStudents(updated)
    setError('')
    setMessage('Password updated successfully. Please login.')
    setTimeout(() => setView('login'), 900)
  }

  return (
    <main className="page">
      <form className="form-card login-card" onSubmit={handleReset}>
        <div className="card-title">Forgot Password</div>
        <label>Email Address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>New Password<input required minLength="4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <button className="btn primary full" type="submit">Update Password</button>
      </form>
    </main>
  )
}

function AdminDashboard({ session, students, setStudents, setView }) {
  const [filters, setFilters] = useState({ name: '', className: '', minAge: '', maxAge: '' })
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!session || session.role !== 'admin') setView('login')
  }, [session, setView])

  const filteredStudents = useMemo(() => students.filter((student) => {
    const age = calculateAge(student.dob)
    const nameMatch = student.name.toLowerCase().includes(filters.name.toLowerCase())
    const classMatch = student.className.toLowerCase().includes(filters.className.toLowerCase())
    const minMatch = filters.minAge === '' || age >= Number(filters.minAge)
    const maxMatch = filters.maxAge === '' || age <= Number(filters.maxAge)
    return nameMatch && classMatch && minMatch && maxMatch
  }), [students, filters])

  function updateFilters(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function deleteStudent(id) {
    const updated = students.filter((student) => student.id !== id)
    setStudents(updated)
    saveStoredStudents(updated)
  }

  function saveEdit(updatedStudent) {
    const updated = students.map((student) => student.id === updatedStudent.id ? updatedStudent : student)
    setStudents(updated)
    saveStoredStudents(updated)
    setEditing(null)
  }

  if (!session || session.role !== 'admin') return null

  return (
    <main className="page dashboard-page">
      <section className="panel">
        <div className="section-heading">
          <h2>Registered Students</h2>
          <span>{filteredStudents.length} record(s)</span>
        </div>
        <div className="filters">
          <input placeholder="Filter by Name" value={filters.name} onChange={(e) => updateFilters('name', e.target.value)} />
          <input placeholder="Filter by Class" value={filters.className} onChange={(e) => updateFilters('className', e.target.value)} />
          <input type="number" min="0" placeholder="Minimum Age" value={filters.minAge} onChange={(e) => updateFilters('minAge', e.target.value)} />
          <input type="number" min="0" placeholder="Maximum Age" value={filters.maxAge} onChange={(e) => updateFilters('maxAge', e.target.value)} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Age</th><th>Class</th><th>Subject</th><th>Marks</th><th>Aadhaar</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => <tr key={student.id}>
                <td>#{student.userId}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{calculateAge(student.dob)}</td>
                <td>{student.className}</td>
                <td>{student.subject}</td>
                <td>{student.marks}</td>
                <td><a href={student.aadhaarData} target="_blank" rel="noreferrer">Open PDF</a></td>
                <td className="actions"><button className="btn small" onClick={() => setEditing(student)}>Edit</button><button className="btn danger small" onClick={() => deleteStudent(student.id)}>Delete</button></td>
              </tr>)}
              {!filteredStudents.length && <tr><td colSpan="9" className="empty">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {editing && <EditStudentModal student={editing} onClose={() => setEditing(null)} onSave={saveEdit} lockNameAndEmail />}
    </main>
  )
}

function EditStudentModal({ student, onClose, onSave, lockNameAndEmail }) {
  const [form, setForm] = useState({ ...student, aadhaarFile: null })
  const [error, setError] = useState('')

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  function toggleInterest(value) {
    setForm((current) => {
      const exists = current.interests.includes(value)
      return { ...current, interests: exists ? current.interests.filter((item) => item !== value) : [...current.interests, value] }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      let aadhaarData = form.aadhaarData
      let aadhaarName = form.aadhaarName
      if (form.aadhaarFile) {
        aadhaarData = await readPdfFile(form.aadhaarFile)
        aadhaarName = makeFileName(form.userId, form.aadhaarFile.name)
      }
      onSave({ ...form, aadhaarData, aadhaarName, aadhaarFile: undefined })
    } catch (uploadError) {
      setError(uploadError.message)
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={handleSubmit}>
        <div className="section-heading"><h2>Edit Student Details</h2><button type="button" className="close" onClick={onClose}>x</button></div>
        <div className="form-grid">
          <label>Name<input disabled={lockNameAndEmail} value={form.name} onChange={(e) => updateField('name', e.target.value)} /></label>
          <label>Email<input disabled value={form.email} /></label>
          <label>Date of Birth<input type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} /></label>
          <label>Gender<select value={form.gender} onChange={(e) => updateField('gender', e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></label>
          <label>Qualification<select value={form.qualification} onChange={(e) => updateField('qualification', e.target.value)}>{qualifications.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Class<input value={form.className} onChange={(e) => updateField('className', e.target.value)} /></label>
          <label>Subject<input value={form.subject} onChange={(e) => updateField('subject', e.target.value)} /></label>
          <label>Marks<input type="number" value={form.marks} onChange={(e) => updateField('marks', e.target.value)} /></label>
          <fieldset className="full-line"><legend>Interests</legend>{interestsList.map((item) => <label className="choice" key={item}><input type="checkbox" checked={form.interests.includes(item)} onChange={() => toggleInterest(item)} /> {item}</label>)}</fieldset>
          <label className="full-line">Replace Aadhaar Document<input accept="application/pdf,.pdf" type="file" onChange={(e) => updateField('aadhaarFile', e.target.files[0])} /></label>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="modal-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" type="submit">Save Changes</button></div>
      </form>
    </div>
  )
}

function StudentDashboard({ session, students, setStudents, setView }) {
  const [editing, setEditing] = useState(false)
  const student = students.find((item) => item.email === session?.email)

  useEffect(() => {
    if (!session || session.role !== 'student') setView('login')
  }, [session, setView])

  function saveStudent(updatedStudent) {
    const updated = students.map((item) => item.id === updatedStudent.id ? updatedStudent : item)
    setStudents(updated)
    saveStoredStudents(updated)
    setEditing(false)
  }

  if (!session || session.role !== 'student' || !student) return null

  return (
    <main className="page dashboard-page">
      <section className="student-shell">
        <div className="welcome">Welcome, {student.name} (User ID: #{student.userId})</div>
        <div className="profile-card">
          <div className="profile-actions"><button className="btn teal small" onClick={() => setEditing(true)}>Edit Profile</button></div>
          <p><strong>Email:</strong> {student.email} <span className="lock">locked</span></p>
          <p><strong>Date of Birth:</strong> {formatDate(student.dob)}</p>
          <p><strong>Gender:</strong> {student.gender}</p>
          <p><strong>Qualification:</strong> {student.qualification}</p>
          <p><strong>Interests:</strong> {student.interests.join(', ') || 'None'}</p>
          <p><strong>Class:</strong> {student.className}</p>
          <p><strong>Subject:</strong> {student.subject}</p>
          <p><strong>Marks:</strong> {student.marks}</p>
          <p><strong>Aadhaar Document</strong> <a className="pdf-icon" href={student.aadhaarData} target="_blank" rel="noreferrer">PDF</a></p>
        </div>
      </section>
      {editing && <EditStudentModal student={student} onClose={() => setEditing(false)} onSave={saveStudent} />}
    </main>
  )
}

export default function App() {
  const [students, setStudents] = useState(() => getStoredStudents())
  const [session, setSession] = useState(() => getSession())
  const [view, setView] = useState(() => {
    const current = getSession()
    if (current?.role === 'admin') return 'admin'
    if (current?.role === 'student') return 'student'
    return 'login'
  })

  function logout() {
    saveSession(null)
    setSession(null)
    setView('login')
  }

  return (
    <div className="app">
      <Header view={view} setView={setView} session={session} logout={logout} />
      {view === 'home' && <Home setView={setView} />}
      {view === 'signup' && <Signup students={students} setStudents={setStudents} setView={setView} />}
      {view === 'login' && <Login students={students} setSession={setSession} setView={setView} />}
      {view === 'forgot' && <ForgotPassword students={students} setStudents={setStudents} setView={setView} />}
      {view === 'admin' && <AdminDashboard session={session} students={students} setStudents={setStudents} setView={setView} />}
      {view === 'student' && <StudentDashboard session={session} students={students} setStudents={setStudents} setView={setView} />}
      <footer>Basic Coding Test - 1 | {session?.role === 'student' ? 'Student Dashboard' : 'Unified Login'} | Task Document</footer>
    </div>
  )
}
