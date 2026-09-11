import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import { useEffect, useState } from 'react'

const loadSaved = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch { return fallback }
}
import './App.css'

// ==================== MOCK DATA ====================

// My profile data
const myProfile = {
  name: 'User',
  year: '3rd Year',
  branch: 'Computer Science',
  college: 'PVPSIT',
  bio: 'Passionate about AI and ML. Love teaching Python and always eager to learn new creative skills!',
}

// Skills for my profile (will be editable)
const initialMyTeachSkills = ['Python', 'Machine Learning', 'Sketching']
const initialMyLearnSkills = ['UI/UX Design', 'Video Editing', 'Classical Guitar']

// Other students on the platform
const students = [
  {
    id: 1,
    name: 'Moukthika',
    branch: 'Computer Science',
    college: 'PVPSIT',
    year: '3rd Year',
    teaches: ['Python', 'Web Development'],
    wantsToLearn: ['UI/UX Design'],
    match: 92,
  },
  {
    id: 2,
    name: 'Devi Mytreya',
    branch: 'Electronics & Communication',
    college: 'CBIT',
    year: '2nd Year',
    teaches: ['Video Editing', 'Graphic Design'],
    wantsToLearn: ['Machine Learning'],
    match: 88,
  },
  {
    id: 3,
    name: 'Ranju Kumari',
    branch: 'Mechanical Engineering',
    college: 'SRK',
    year: '3rd Year',
    teaches: ['Artificial Intelligence', 'Photography'],
    wantsToLearn: ['Python'],
    match: 90,
  },
  {
    id: 4,
    name: 'Harshitha',
    branch: 'Civil Engineering',
    college: 'KLU',
    year: '4th Year',
    teaches: ['AutoCAD', 'Mathematics'],
    wantsToLearn: ['Guitar'],
    match: 70,
  },
  {
    id: 5,
    name: 'Kulsum',
    branch: 'Information Technology',
    college: 'Vasavi College',
    year: '3rd Year',
    teaches: ['UI/UX Design', 'Figma', 'Photoshop'],
    wantsToLearn: ['Machine Learning', 'Python'],
    match: 95,
  },
  {
    id: 6,
    name: 'Akhil',
    branch: 'Computer Science',
    college: 'Muffakham Jah College',
    year: '1st Year',
    teaches: ['Guitar', 'Music Theory'],
    wantsToLearn: ['Web Development', 'Python'],
    match: 82,
  },
]

// Incoming swap requests
const initialRequests = [
  {
    id: 1,
    name: 'Moukthika',
    branch: 'Computer Science',
    wantsToLearn: 'Python',
    teachesInReturn: 'Web Development',
    status: 'pending',
  },
  {
    id: 2,
    name: 'Devi Mytreya',
    branch: 'Electronics & Communication',
    wantsToLearn: 'Machine Learning',
    teachesInReturn: 'Video Editing',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Harshitha',
    branch: 'Civil Engineering',
    wantsToLearn: 'Python',
    teachesInReturn: 'AutoCAD',
    status: 'pending',
  },
]

// Matched students for chat
const initialChatContacts = [
  { id: 1, name: 'Kulsum', branch: 'Information Technology' },
  { id: 2, name: 'Akhil', branch: 'Computer Science' },
]

// Pre-loaded messages for each chat contact
const initialMessages = {
  1: [
    { from: 'them', text: 'Hi! I saw you teach Python. I can teach you UI/UX Design!' },
    { from: 'me', text: 'That sounds great! When can we start?' },
    { from: 'them', text: 'How about this weekend? We can meet online.' },
  ],
  2: [
    { from: 'them', text: 'Hey! Interested in learning Guitar? I can help!' },
    { from: 'me', text: 'Yes! I have always wanted to learn. Can you teach me basics?' },
  ],
}

// Completed exchanges for ratings
const initialExchanges = [
  {
    id: 1,
    name: 'Kulsum',
    skillExchanged: 'UI/UX Design for Python',
    rating: 0,
    review: '',
  },
  {
    id: 2,
    name: 'Akhil',
    skillExchanged: 'Guitar for Web Development',
    rating: 0,
    review: '',
  },
]

// Menu items for the sidebar
const menuItems = [
  { key: 'home', label: 'Home' },
  { key: 'profile', label: 'My Profile' },
  { key: 'matches', label: 'Find Matches' },
  { key: 'messages', label: 'Messages' },
  { key: 'requests', label: 'Requests' },
  { key: 'ratings', label: 'Ratings & Reviews' },
  { key: 'settings', label: 'Settings' },
]

// Simple SVG icons for the sidebar menu
const menuIcons = {
  home: '🏠',
  profile: '👤',
  matches: '🔍',
  messages: '💬',
  requests: '📨',
  ratings: '⭐',
  settings: '⚙️',
}

// ==================== MAIN APP COMPONENT ====================

function App() {
  // --- STATE: which page is currently shown ---
  const [currentPage, setCurrentPage] = useState('home')

  // --- STATE: my skills ---
  const [myTeachSkills, setMyTeachSkills] = useState(() => loadSaved('skillswap_teach', initialMyTeachSkills))
  const [myLearnSkills, setMyLearnSkills] = useState(() => loadSaved('skillswap_learn', initialMyLearnSkills))
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [skillType, setSkillType] = useState('teach') // 'teach' or 'learn'

  // --- STATE: profile editing ---
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(() => loadSaved('skillswap_profile', myProfile))

  // --- STATE: requests ---
  const [requests, setRequests] = useState(() => loadSaved('skillswap_requests', initialRequests))

  // --- STATE: sent request feedback ---
  const [sentRequests, setSentRequests] = useState(() => loadSaved('skillswap_sent', []))
  const [successMessage, setSuccessMessage] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // --- STATE: chat ---
  const [activeContactId, setActiveContactId] = useState(1)
  const [messages, setMessages] = useState(() => loadSaved('skillswap_messages', initialMessages))
  const [newMessage, setNewMessage] = useState('')

  // --- STATE: ratings ---
  const [exchanges, setExchanges] = useState(() => loadSaved('skillswap_exchanges', initialExchanges))
  const [reviewTexts, setReviewTexts] = useState({})
  // --- STATE: settings ---
  const [settings, setSettings] = useState(() => loadSaved('skillswap_settings', {
    emailNotif: true,
    pushNotif: true,
    profileVisible: true,
    showOnline: true,
  }))
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [matchSearch, setMatchSearch] = useState('')
  const [skillError, setSkillError] = useState('')

  // Persist important app state so refresh does not lose progress
  useEffect(() => { localStorage.setItem('skillswap_profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('skillswap_teach', JSON.stringify(myTeachSkills)) }, [myTeachSkills])
  useEffect(() => { localStorage.setItem('skillswap_learn', JSON.stringify(myLearnSkills)) }, [myLearnSkills])
  useEffect(() => { localStorage.setItem('skillswap_requests', JSON.stringify(requests)) }, [requests])
  useEffect(() => { localStorage.setItem('skillswap_sent', JSON.stringify(sentRequests)) }, [sentRequests])
  useEffect(() => { localStorage.setItem('skillswap_messages', JSON.stringify(messages)) }, [messages])
  useEffect(() => { localStorage.setItem('skillswap_exchanges', JSON.stringify(exchanges)) }, [exchanges])
  useEffect(() => { localStorage.setItem('skillswap_settings', JSON.stringify(settings)) }, [settings])
  // Save profile to Firebase Firestore
useEffect(() => {
  const saveProfileToFirebase = async () => {
    try {
      await setDoc(doc(db, "users", "currentUser"), {
        ...profile,
        teachSkills: myTeachSkills,
        learnSkills: myLearnSkills,
        updatedAt: new Date().toISOString(),
      });

      console.log("✅ SkillSwap data saved to Firebase!");
    } catch (error) {
      console.error("❌ Firebase save error:", error);
    }
  };

  saveProfileToFirebase();
}, [profile, myTeachSkills, myLearnSkills])
  // ==================== HANDLER FUNCTIONS ====================

  // Add a new skill to teach or learn
  function handleAddSkill() {
    const skill = newSkill.trim()
    if (!skill) { setSkillError('Please enter a skill'); return }
    if (skill.length > 50) { setSkillError('Skill must be 50 characters or less'); return }
    setSkillError('')

    if (skillType === 'teach') {
      setMyTeachSkills([...myTeachSkills, skill])
    } else {
      setMyLearnSkills([...myLearnSkills, skill])
    }

    setNewSkill('') // clear input
    setShowAddSkill(false) // close form
  }

  // Remove a skill
  function handleRemoveSkill(skill, type) {
    if (type === 'teach') {
      setMyTeachSkills(myTeachSkills.filter((s) => s !== skill))
    } else {
      setMyLearnSkills(myLearnSkills.filter((s) => s !== skill))
    }
  }

  // Send a swap request to a student
  function handleSendRequest(studentId) {
    setSentRequests((prev) => {
      if (prev.includes(studentId)) return prev
      return [...prev, studentId]
    })
    setSuccessMessage('✓ Swap request sent successfully!')
    setTimeout(() => setSuccessMessage(''), 2200)
  }

  // Accept a request
  function handleAcceptRequest(requestId) {
  setRequests(
    requests.map((req) =>
      req.id === requestId
        ? { ...req, status: 'Accepted' }
        : req
    )
  )

  setSuccessMessage('✓ Request Accepted Successfully!')

  setTimeout(() => {
    setSuccessMessage('')
  }, 2500)
}

  // Decline a request
  function handleDeclineRequest(requestId) {
    setRequests(
      requests.map((req) =>
        req.id === requestId ? { ...req, status: 'Declined' } : req
      )
    )
  }

  // Send a chat message
  function handleSendMessage() {
    if (newMessage.trim() === '') return

    const currentMsgs = messages[activeContactId] || []
    setMessages({
      ...messages,
      [activeContactId]: [...currentMsgs, { from: 'me', text: newMessage.trim() }],
    })
    setNewMessage('')
  }

  // Set rating stars for an exchange
  function handleSetRating(exchangeId, stars) {
    setExchanges(
      exchanges.map((ex) =>
        ex.id === exchangeId ? { ...ex, rating: stars } : ex
      )
    )
  }

  // Save a review
  function handleSaveReview(exchangeId, reviewText) {
    setExchanges(
      exchanges.map((ex) =>
        ex.id === exchangeId ? { ...ex, review: reviewText } : ex
      )
    )
  }

  // Save settings
  function handleSaveSettings() {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000) // hide after 3 seconds
  }

  // Toggle a settings checkbox
  function handleToggleSetting(key) {
    setSettings({ ...settings, [key]: !settings[key] })
  }

  // ==================== PAGE RENDERING ====================

  // Render the correct page based on currentPage state
  function renderPage() {
  switch (currentPage) {
    case 'home':
      return HomePage()
    case 'profile':
      return renderProfilePage()
    case 'matches':
      return MatchesPage()
    case 'messages':
      return MessagesPage()
    case 'requests':
      return RequestsPage()
    case 'ratings':
      return RatingsPage()
    case 'settings':
      return SettingsPage()
    default:
      return HomePage()
  }
}
  // ==================== PAGE COMPONENTS ====================

  // --- HOME PAGE ---
  function HomePage() {
    return (
      <div className="page">
        {/* Hero section */}
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Skills Today, Stronger Tomorrow</h1>
            <p className="hero-subtitle">
              A platform for college students to teach, learn and grow together through skill exchange.
            </p>
            <button className="hero-btn" onClick={() => setCurrentPage('matches')}>
              Find Your Match
            </button>
          </div>
          <div className="hero-decoration">
            <div className="hero-circle circle-1"></div>
            <div className="hero-circle circle-2"></div>
            <div className="hero-circle circle-3"></div>
          </div>
        </div>

        {/* My Skill Profile card */}
        <div className="section-card">
          <h2 className="section-title">My Skill Profile</h2>
          <div className="profile-summary">
            <div className="profile-avatar">U</div>
            <div>
              <h3 className="profile-name">{profile.name}</h3>
              <p className="profile-info">{profile.year} · {profile.branch}</p>
            </div>
          </div>
          <div className="skills-row">
            <div className="skills-group">
              <h4>Skills I Teach</h4>
              <div className="tag-list">
                {myTeachSkills.map((skill) => (
                  <span key={skill} className="skill-tag teach-tag">{skill}</span>
                ))}
              </div>
            </div>
            <div className="skills-group">
              <h4>Skills I Want To Learn</h4>
              <div className="tag-list">
                {myLearnSkills.map((skill) => (
                  <span key={skill} className="skill-tag learn-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Matches */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Recommended Matches</h2>
            <button className="link-btn" onClick={() => setCurrentPage('matches')}>View All</button>
          </div>
          <div className="match-cards-row">
            {students.slice(0, 3).map((student) => (
              <div key={student.id} className="mini-match-card">
                <div className="mini-match-header">
                  <div className="mini-avatar">{student.name.charAt(0)}</div>
                  <div className="mini-match-percent">{student.match}%</div>
                </div>
                <h4>{student.name}</h4>
                <p className="mini-branch">{student.branch}</p>
                <p className="mini-skills">Teaches: {student.teaches.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Recent Requests</h2>
            <button className="link-btn" onClick={() => setCurrentPage('requests')}>View All</button>
          </div>
          <div className="recent-list">
            {requests.slice(0, 2).map((req) => (
              <div key={req.id} className="recent-item">
                <div className="recent-avatar">{req.name.charAt(0)}</div>
                <div>
                  <h5>{req.name}</h5>
                  <p>Wants to learn: {req.wantsToLearn}</p>
                </div>
                <span className={`status-badge status-${req.status}`}>{req.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Recent Messages</h2>
            <button className="link-btn" onClick={() => setCurrentPage('messages')}>View All</button>
          </div>
          <div className="recent-list">
            {initialChatContacts.map((contact) => (
              <div key={contact.id} className="recent-item" onClick={() => { setActiveContactId(contact.id); setCurrentPage('messages') }}>
                <div className="recent-avatar">{contact.name.charAt(0)}</div>
                <div>
                  <h5>{contact.name}</h5>
                  <p>{contact.branch}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- PROFILE PAGE ---
  function renderProfilePage() {
    return (
      <div className="page">
        <div className="section-card profile-card-large">
          <div className="profile-header">
            <div className="profile-avatar large">U</div>
            <div className="profile-header-info">
              {isEditing ? (
                <input
                  className="edit-input name-input"
                  value={profile.name}
                  maxLength={60}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              ) : (
                <h2>{profile.name}</h2>
              )}
              <p className="profile-info">
                {isEditing ? (
                  <>
                    <input className="edit-input" value={profile.college} onChange={(e) => setProfile({ ...profile, college: e.target.value })} />
                    <input className="edit-input" value={profile.branch} onChange={(e) => setProfile({ ...profile, branch: e.target.value })} />
                    <input className="edit-input" value={profile.year} onChange={(e) => setProfile({ ...profile, year: e.target.value })} />
                  </>
                ) : (
                  <>{profile.college} · {profile.branch} · {profile.year}</>
                )}
              </p>
            </div>
            <button
              className="primary-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          <div className="bio-section">
            <h4>About Me</h4>
            {isEditing ? (
              <textarea
                className="edit-textarea"
                value={profile.bio}
                maxLength={400}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            ) : (
              <p className="bio-text">{profile.bio}</p>
            )}
          </div>

          <div className="skills-row">
            <div className="skills-group">
              <div className="skills-group-header">
                <h4>Skills I Teach</h4>
              </div>
              <div className="tag-list">
                {myTeachSkills.map((skill) => (
                  <span key={skill} className="skill-tag teach-tag removable">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill, 'teach')} className="remove-skill-btn">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="skills-group">
              <div className="skills-group-header">
                <h4>Skills I Want To Learn</h4>
              </div>
              <div className="tag-list">
                {myLearnSkills.map((skill) => (
                  <span key={skill} className="skill-tag learn-tag removable">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill, 'learn')} className="remove-skill-btn">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Add Skill section */}
          {showAddSkill ? (
            <div className="add-skill-form">
              <select className="edit-input" value={skillType} onChange={(e) => setSkillType(e.target.value)}>
                <option value="teach">Skill I Teach</option>
                <option value="learn">Skill I Want To Learn</option>
              </select>
              <input
                className="edit-input"
                placeholder="Enter skill name..."
                value={newSkill}
                maxLength={50}
                onChange={(e) => { setNewSkill(e.target.value); setSkillError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button className="primary-btn" onClick={handleAddSkill}>Add</button>
              {skillError && <p className="form-error">{skillError}</p>}
              <button className="secondary-btn" onClick={() => { setShowAddSkill(false); setNewSkill('') }}>Cancel</button>
            </div>
          ) : (
            <button className="add-skill-btn" onClick={() => setShowAddSkill(true)}>
              + Add Skill
            </button>
          )}
        </div>
      </div>
    )
  }

  // --- FIND MATCHES PAGE ---
  function MatchesPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Find Matches</h1>
          <p className="page-subtitle">Discover students to exchange skills with</p>
        </div>
        <div className="match-search-wrap">
          <input
            className="match-search"
            value={matchSearch}
            onChange={(e) => setMatchSearch(e.target.value.slice(0, 400))}
            placeholder="Search by student, branch or skill..."
            maxLength={400}
          />
        </div>
        <div className="match-cards-grid">
          {students.filter((student) => {
            const q = matchSearch.trim().toLowerCase()
            if (!q) return true
            return [student.name, student.branch, student.college, ...student.teaches, ...student.wantsToLearn]
              .some((value) => value.toLowerCase().includes(q))
          }).map((student) => (
            <div key={student.id} className="match-card">
              <div className="match-card-top">
                <div className="match-avatar">{student.name.charAt(0)}</div>
                <div className={`match-percent-badge ${getMatchColor(student.match)}`}>
                  {student.match}% Match
                </div>
              </div>
              <h3 className="match-name">{student.name}</h3>
              <p className="match-branch">{student.branch}</p>
              <p className="match-college">{student.college} · {student.year}</p>

              <div className="match-skills-section">
                <p className="match-skill-label">Teaches</p>
                <div className="tag-list">
                  {student.teaches.map((s) => (
                    <span key={s} className="skill-tag teach-tag">{s}</span>
                  ))}
                </div>
              </div>
              <div className="match-skills-section">
                <p className="match-skill-label">Wants to Learn</p>
                <div className="tag-list">
                  {student.wantsToLearn.map((s) => (
                    <span key={s} className="skill-tag learn-tag">{s}</span>
                  ))}
                </div>
              </div>

              <button
                className={sentRequests.includes(student.id) ? 'sent-btn' : 'primary-btn full-width'}
                onClick={() => handleSendRequest(student.id)}
                disabled={sentRequests.includes(student.id)}
              >
                {sentRequests.includes(student.id) ? '✓ Request Sent!' : 'Send Request'}
              </button>
            </div>
          ))}
          {students.filter((student) => {
            const q = matchSearch.trim().toLowerCase()
            if (!q) return true
            return [student.name, student.branch, student.college, ...student.teaches, ...student.wantsToLearn]
              .some((value) => value.toLowerCase().includes(q))
          }).length === 0 && (
            <div className="empty-state">🔎 No matching students found. Try another skill or name.</div>
          )}
        </div>
      </div>
    )
  }

  // --- REQUESTS PAGE ---
  function RequestsPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Swap Requests</h1>
          <p className="page-subtitle">Accept or decline incoming skill swap requests</p>
        </div>
        <div className="requests-list">
          {requests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-left">
                <div className="request-avatar">{req.name.charAt(0)}</div>
                <div className="request-info">
                  <h4>{req.name}</h4>
                  <p className="request-branch">{req.branch}</p>
                  <p className="request-skill">
                    Wants to learn: <strong>{req.wantsToLearn}</strong>
                  </p>
                  <p className="request-skill">
                    Offers in return: <strong>{req.teachesInReturn}</strong>
                  </p>
                </div>
              </div>
              <div className="request-actions">
                {req.status === 'pending' ? (
                  <>
                    <button className="accept-btn" onClick={() => handleAcceptRequest(req.id)}>Accept</button>
                    <button className="decline-btn" onClick={() => handleDeclineRequest(req.id)}>Decline</button>
                  </>
                ) : (
                  <span className={`status-badge status-${req.status}`}>
                    {req.status === 'Accepted' ? '✓ Accepted' : '✕ Declined'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="empty-state">📨 No swap requests yet.</div>
          )}
        </div>
      </div>
    )
  }

  // --- MESSAGES PAGE ---
  function MessagesPage() {
    const currentMessages = messages[activeContactId] || []
    const activeContact = initialChatContacts.find((c) => c.id === activeContactId)

    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">Chat with your matched students</p>
        </div>
        <div className="chat-container">
          {/* Left side: list of contacts */}
          <div className="chat-sidebar">
            {initialChatContacts.map((contact) => (
              <div
                key={contact.id}
                className={`chat-contact ${activeContactId === contact.id ? 'active-contact' : ''}`}
                onClick={() => setActiveContactId(contact.id)}
              >
                <div className="chat-contact-avatar">{contact.name.charAt(0)}</div>
                <div>
                  <h5>{contact.name}</h5>
                  <p>{contact.branch}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right side: chat window */}
          <div className="chat-window">
            <div className="chat-header">
              <div className="chat-contact-avatar small">{activeContact?.name.charAt(0)}</div>
              <h4>{activeContact?.name}</h4>
            </div>
            <div className="chat-messages">
              {currentMessages.map((msg, index) => (
                <div key={index} className={`message ${msg.from === 'me' ? 'message-me' : 'message-them'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <input
                className="chat-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="send-btn" onClick={handleSendMessage} disabled={!newMessage.trim()}>Send</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- RATINGS & REVIEWS PAGE ---
  function RatingsPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Ratings & Reviews</h1>
          <p className="page-subtitle">Rate your completed skill exchanges</p>
        </div>
        <div className="ratings-list">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="rating-card">
              <div className="rating-header">
                <div className="request-avatar">{exchange.name.charAt(0)}</div>
                <div>
                  <h4>{exchange.name}</h4>
                  <p className="exchange-skill">{exchange.skillExchanged}</p>
                </div>
              </div>

              {/* Star rating selector */}
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= exchange.rating ? 'star-active' : ''}`}
                    onClick={() => handleSetRating(exchange.id, star)}
                  >
                    ★
                  </span>
                ))}
                {exchange.rating > 0 && <span className="rating-text">{exchange.rating}/5</span>}
              </div>

              {/* Review text area */}
              <textarea
                className="review-textarea"
                placeholder="Write your review..."
                value={reviewTexts[exchange.id] || ''}
                onChange={(e) => setReviewTexts({ ...reviewTexts, [exchange.id]: e.target.value })}
              />

              {/* Show saved review if any */}
              {exchange.review && (
                <div className="saved-review">
                  <strong>Your review:</strong> {exchange.review}
                </div>
              )}

              <button
                className="primary-btn"
                onClick={() => handleSaveReview(exchange.id, reviewTexts[exchange.id] || '')}
              >
                Submit Review
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- SETTINGS PAGE ---
  function SettingsPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>

        {/* Account Settings */}
        <div className="section-card">
          <h3 className="settings-section-title">Account Settings</h3>
          <div className="settings-row">
            <label>Full Name</label>
            <input className="edit-input" defaultValue={profile.name} />
          </div>
          <div className="settings-row">
            <label>Email</label>
            <input className="edit-input" defaultValue="moukthika.p@example.com" />
          </div>
          <div className="settings-row">
            <label>College</label>
            <input className="edit-input" defaultValue={profile.college} />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="section-card">
          <h3 className="settings-section-title">Notification Settings</h3>
          <div className="settings-toggle-row">
            <span>Email Notifications</span>
            <label className="switch">
              <input type="checkbox" checked={settings.emailNotif} onChange={() => handleToggleSetting('emailNotif')} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-toggle-row">
            <span>Push Notifications</span>
            <label className="switch">
              <input type="checkbox" checked={settings.pushNotif} onChange={() => handleToggleSetting('pushNotif')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="section-card">
          <h3 className="settings-section-title">Privacy Settings</h3>
          <div className="settings-toggle-row">
            <span>Profile Visible to Others</span>
            <label className="switch">
              <input type="checkbox" checked={settings.profileVisible} onChange={() => handleToggleSetting('profileVisible')} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-toggle-row">
            <span>Show Online Status</span>
            <label className="switch">
              <input type="checkbox" checked={settings.showOnline} onChange={() => handleToggleSetting('showOnline')} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button className="primary-btn save-settings-btn" onClick={handleSaveSettings}>
          Save Changes
        </button>
        {settingsSaved && (
          <div className="success-message">✓ Settings saved successfully!</div>
        )}
      </div>
    )
  }

  // ==================== RENDER ====================

  return (
    <>
      {successMessage && (
        <div className="success-popup">{successMessage}</div>
      )}
      <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🔄</div>
          <span className="logo-text">SkillSwap</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'nav-active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              <span className="nav-icon">{menuIcons[item.key]}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">MP</div>
            <div>
              <p className="sidebar-user-name">{profile.name}</p>
              <p className="sidebar-user-info">{profile.branch}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="main-content">
        <div className="topbar">
          <div className="profile-menu-wrapper">
            <button className="profile-menu-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="topbar-avatar">{profile.name.charAt(0).toUpperCase()}</div>
              <span className="topbar-name">{profile.name}</span>
              <span className="topbar-arrow">⌄</span>
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <button onClick={() => { setCurrentPage('profile'); setShowProfileMenu(false) }}>👤 My Profile</button>
                <button onClick={() => { setCurrentPage('settings'); setShowProfileMenu(false) }}>⚙️ Settings</button>
                <button onClick={() => { setCurrentPage('requests'); setShowProfileMenu(false) }}>📨 Requests</button>
                <button onClick={() => { setCurrentPage('messages'); setShowProfileMenu(false) }}>💬 Messages</button>
                <div className="dropdown-divider"></div>
                <button onClick={() => { setShowProfileMenu(false); setSuccessMessage('✓ Logged out successfully!'); setTimeout(() => setSuccessMessage(''), 2500) }}>🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
        {renderPage()}
      </main>
      </div>
    </>
  )
}

// ==================== HELPER FUNCTIONS ====================

// Get color class based on match percentage
function getMatchColor(percent) {
  if (percent >= 90) return 'match-high'
  if (percent >= 80) return 'match-medium'
  return 'match-low'
}

export default App
