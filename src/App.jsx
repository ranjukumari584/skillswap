
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./Auth";
import "./App.css";

const DEFAULT_PROFILE = {
  name: "",
  year: "3rd Year",
  branch: "",
  college: "",
  bio: "",
};

const DEMO_STUDENTS = [
  { id: "sample1", name: "Moukthika", branch: "Computer Science", college: "PVPSIT", year: "3rd Year", teaches: ["Python", "Web Development"], wantsToLearn: ["UI/UX Design"] },
  { id: "sample2", name: "Devi Mytreya", branch: "Electronics & Communication", college: "CBIT", year: "2nd Year", teaches: ["Video Editing", "Graphic Design"], wantsToLearn: ["Machine Learning"] },
  { id: "sample3", name: "Harshitha", branch: "Civil Engineering", college: "KLU", year: "4th Year", teaches: ["AutoCAD", "Mathematics"], wantsToLearn: ["Python"] },
  { id: "sample4", name: "Akhil", branch: "Information Technology", college: "PVPSIT", year: "3rd Year", teaches: ["Java", "Data Structures"], wantsToLearn: ["React"] },
  { id: "sample5", name: "Kulsum", branch: "Computer Science", college: "VR Siddhartha", year: "2nd Year", teaches: ["UI/UX Design", "Figma"], wantsToLearn: ["Python", "AI/ML"] },
  { id: "sample6", name: "Sravya", branch: "Artificial Intelligence", college: "PVPSIT", year: "3rd Year", teaches: ["Machine Learning", "Python"], wantsToLearn: ["Public Speaking"] },
  { id: "sample7", name: "Karthik", branch: "Computer Science", college: "VIT-AP", year: "4th Year", teaches: ["React", "JavaScript"], wantsToLearn: ["Cloud Computing"] },
  { id: "sample8", name: "Nikhitha", branch: "Information Technology", college: "SRM AP", year: "2nd Year", teaches: ["Canva", "Presentation Design"], wantsToLearn: ["Web Development"] },
  { id: "sample9", name: "Sai Teja", branch: "Electronics & Communication", college: "PVPSIT", year: "3rd Year", teaches: ["C Programming", "Arduino"], wantsToLearn: ["Python"] },
  { id: "sample10", name: "Pranavi", branch: "Computer Science", college: "KLU", year: "3rd Year", teaches: ["SQL", "DBMS"], wantsToLearn: ["Machine Learning"] },
  { id: "sample11", name: "Manoj", branch: "Mechanical Engineering", college: "VR Siddhartha", year: "4th Year", teaches: ["3D Modelling", "AutoCAD"], wantsToLearn: ["Java"] },
  { id: "sample12", name: "Anusha", branch: "Artificial Intelligence", college: "VIT-AP", year: "2nd Year", teaches: ["Python", "Data Analytics"], wantsToLearn: ["UI/UX Design"] },
];

const PAGES = [
  ["home", "🏠", "Home"],
  ["profile", "👤", "My Profile"],
  ["matches", "🔍", "Find Matches"],
  ["messages", "💬", "Messages"],
  ["requests", "📨", "Requests"],
  ["ratings", "⭐", "Ratings & Reviews"],
  ["settings", "⚙️", "Settings"],
];

const DEFAULT_SETTINGS = {
  emailNotif: true,
  pushNotif: true,
  profileVisible: true,
  showOnline: true,
};

function SkillTags({
  skills = [],
  type = "teach",
  removable = false,
  onRemove,
}) {
  if (!skills.length) {
    return (
      <div className="tag-list">
        <span className="muted-text">No skills added yet.</span>
      </div>
    );
  }

  return (
    <div className="tag-list">
      {skills.map((skill) => (
        <span
          className={`skill-tag ${
            type === "teach" ? "teach-tag" : "learn-tag"
          }`}
          key={skill}
        >
          {skill}
          {removable && (
            <button
              type="button"
              className="remove-skill-btn"
              onClick={() => onRemove?.(skill)}
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  disabled,
  multiline = false,
  maxLength,
}) {
  const sharedProps = {
    value: value ?? "",
    disabled,
    maxLength,
    onChange: (event) => onChange(event.target.value),
  };

  return (
    <label
      className={`profile-field ${
        multiline ? "profile-field-full" : ""
      }`}
    >
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="edit-textarea"
          {...sharedProps}
          rows={4}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      ) : (
        <input
          className="edit-input"
          {...sharedProps}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      )}
    </label>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [realStudents, setRealStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillType, setSkillType] = useState("teach");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);

  const [requests, setRequests] = useState([]);
  
  
  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }

    let cancelled = false;

    async function loadReceivedRequests() {
      try {
        const requestsQuery = query(
          collection(db, "swapRequests"),
          where("toUid", "==", user.uid)
        );

        const snapshot = await getDocs(requestsQuery);
        console.log("Logged-in UID:", user.uid);
        console.log("Requests found:", snapshot.size);

        const receivedRequests = snapshot.docs.map((requestDoc) => {
          const data = requestDoc.data();

          return {
            id: requestDoc.id,
            name: data.fromName || "Student",
            branch: data.fromBranch || "",
            wantsToLearn: data.wantsToLearn || "Skill exchange",
            teachesInReturn: data.teachesInReturn || "Skills",
            status: (data.status || "pending").toLowerCase(),
            isDemo: false,
          };
        });

        if (!cancelled) {
          setRequests(receivedRequests);
          console.log("Received requests loaded:", receivedRequests);
          console.log("Logged-in user UID:", user.uid);
          console.log("Received request count:", snapshot.size);
        }
      } catch (error) {
        console.error("Failed to load received requests:", error);
      }
    }

    loadReceivedRequests();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);


  const [sentRequests, setSentRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState("");
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function notify(message) {
    setNotice(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setNotice(""), 3000);
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileLoaded(false);
      return undefined;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoaded(false);

      try {
        const ref = doc(db, "users", user.uid);
        const snapshot = await getDoc(ref);

        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          setProfile({
            name: data.name || user.displayName || "",
            year: data.year || "3rd Year",
            branch: data.branch || "",
            college: data.college || "",
            bio: data.bio || "",
          });

          setTeachSkills(
            Array.isArray(data.teachSkills) ? data.teachSkills : []
          );

          setLearnSkills(
            Array.isArray(data.learnSkills) ? data.learnSkills : []
          );

          setSentRequests(
            Array.isArray(data.sentRequests)
              ? data.sentRequests
              : []
          );

          setContacts(
            Array.isArray(data.contacts) ? data.contacts : []
          );

          setMessages(
            data.messages && typeof data.messages === "object"
              ? data.messages
              : {}
          );

          setRatings(
            data.ratings && typeof data.ratings === "object"
              ? data.ratings
              : {}
          );

          setReviews(
            data.reviews && typeof data.reviews === "object"
              ? data.reviews
              : {}
          );

          setSettings({
            ...DEFAULT_SETTINGS,
            ...(data.settings || {}),
          });
        } else {
          const initialProfile = {
            ...DEFAULT_PROFILE,
            name: user.displayName || "",
          };

          setProfile(initialProfile);
          setTeachSkills([]);
          setLearnSkills([]);

          await setDoc(
            ref,
            {
              uid: user.uid,
              email: user.email || "",
              ...initialProfile,
              teachSkills: [],
              learnSkills: [],
              requests: [],
              sentRequests: [],
              contacts: [],
              messages: {},
              ratings: {},
              reviews: {},
              settings: DEFAULT_SETTINGS,
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Profile loading failed:", error);

        if (!cancelled) {
          notify(
            "Profile could not load. Check Firestore rules and connection."
          );
        }
      } finally {
        if (!cancelled) setProfileLoaded(true);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);
  
  
  useEffect(() => {
    if (!user) {
      setRealStudents([]);
      return undefined;
    }

    let cancelled = false;

    async function loadStudents() {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const snapshot = await getDocs(collection(db, "users"));

        const students = snapshot.docs
          .filter((studentDoc) => studentDoc.id !== user.uid)
          .map((studentDoc) => {
            const data = studentDoc.data();

            return {
              id: studentDoc.id,
              name: data.name || data.displayName || "Student",
              branch: data.branch || "",
              college: data.college || "",
              year: data.year || "",
              teaches: Array.isArray(data.teachSkills)
                ? data.teachSkills
                : [],
              wantsToLearn: Array.isArray(data.learnSkills)
                ? data.learnSkills
                : [],
            };
          });

        if (!cancelled) {
          setRealStudents(students);
          console.log("Firebase students loaded:", students);
        }
      } catch (error) {
        console.error("Student loading failed:", error);

        if (!cancelled) {
          setStudentsError(error.message || "Could not load students.");
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !profileLoaded) return undefined;

    let cancelled = false;

    async function saveToCloud() {
      setProfileSaving(true);

      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email || "",
            ...profile,
            teachSkills,
            learnSkills,
            sentRequests,
            contacts,
            messages,
            ratings,
            reviews,
            settings,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Profile saving failed:", error);

        if (!cancelled) {
          notify("Could not save data to Firestore.");
        }
      } finally {
        if (!cancelled) setProfileSaving(false);
      }
    }

    saveToCloud();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    profileLoaded,
    profile,
    teachSkills,
    learnSkills,
    sentRequests,
    contacts,
    messages,
    ratings,
    reviews,
    settings,
  ]);

  async function logout() {
    try {
      await signOut(auth);
      setCurrentPage("home");
      setEditing(false);
    } catch (error) {
      console.error("Logout failed:", error);
      notify("Logout failed. Please try again.");
    }
  }

  async function saveProfile() {
    const cleanName = profile.name.trim();

    if (!cleanName) {
      notify("Please enter your name.");
      return;
    }

    try {
      if (user) {
        await updateProfile(user, { displayName: cleanName });
      }

      setProfile((old) => ({ ...old, name: cleanName }));
      setEditing(false);
      notify("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      notify("Profile update failed. Please try again.");
    }
  }

  function addSkill() {
    const skill = newSkill.trim();

    if (!skill) {
      notify("Please enter a skill.");
      return;
    }

    const list = skillType === "teach" ? teachSkills : learnSkills;

    if (
      list.some(
        (item) => item.toLowerCase() === skill.toLowerCase()
      )
    ) {
      notify("This skill is already added.");
      return;
    }

    if (skillType === "teach") {
      setTeachSkills((old) => [...old, skill]);
    } else {
      setLearnSkills((old) => [...old, skill]);
    }

    setNewSkill("");
    notify("Skill added!");
  }

  function removeSkill(skill, type) {
    if (type === "teach") {
      setTeachSkills((old) =>
        old.filter((item) => item !== skill)
      );
    } else {
      setLearnSkills((old) =>
        old.filter((item) => item !== skill)
      );
    }
  }

  
  async function sendRequest(student) {
    console.log("sendRequest called:", student.id);
    if (sentRequests.includes(student.id)) return;

    const isRealStudent = realStudents.some(
      (item) => item.id === student.id
    );
    console.log("Clicked student:", student);
    console.log("Real student IDs:", realStudents.map((item) => item.id));
    const request = {
      id: `${user.uid}_${student.id}`,
      studentId: student.id,
      name: student.name,
      branch: student.branch,
      wantsToLearn: teachSkills[0] || "Skill exchange",
      teachesInReturn:
        (student.teaches || student.teachSkills || [])[0] || "Skills",
      status: "pending",
    };

    if (!isRealStudent) {
      setSentRequests((old) => [...old, student.id]);
      setRequests((old) => [...old,
        { ...request, isDemo: true },
      ]);
      notify("Demo swap request saved to your account.");
      return;
    }

    try {
      console.log("Sending request to Firebase:", student.id);
      console.log("SENDER UID:", user.uid);
      console.log("RECEIVER UID:", student.id); 
      const docRef = await addDoc(collection(db, "swapRequests"), {
        fromUid: user.uid,
        toUid: student.id,
        fromName: profile.name || user.displayName || user.email || "Student",
        fromBranch: profile.branch || "",
        toName: student.name,
        wantsToLearn: request.wantsToLearn,
        teachesInReturn: request.teachesInReturn,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSentRequests((old) => [...old, student.id]);
      console.log("Firebase request saved successfully");
      notify("Swap request sent successfully!");

    } catch (error) {
      console.error("Swap request error:", error);
      notify("Request failed. Please try again.");
    }
  }


  
  async function updateRequest(id, status) {
    const request = requests.find((item) => item.id === id);

    if (!request) {
      notify("Request not found. Refresh and try again.");
      return;
    }

    const nextStatus = status.toLowerCase();
    if (!["accepted", "declined"].includes(nextStatus)) {
      notify("Invalid request status.");
      return;
    }

    // Demo requests are only examples; update them locally.
    if (request.isDemo) {
      setRequests((old) =>
        old.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item
        )
      );
      notify(`Demo request ${nextStatus}.`);
      return;
    }

    try {
      // Firestore rules should allow only the receiver to accept/decline.
      await updateDoc(doc(db, "swapRequests", id), {
        status: nextStatus,
      });

      setRequests((old) =>
        old.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item
        )
      );
      notify(`Request ${nextStatus}.`);
    } catch (error) {
      console.error("Update request error:", error);
      notify("Could not update request. Check Firestore rules and console.");
    }
  }


  function sendMessage() {
    const text = newMessage.trim();

    if (!text || !activeContact.trim()) return;

    const contactKey = activeContact.trim();

    setMessages((old) => ({
      ...old,
      [contactKey]: [
        ...(old[contactKey] || []),
        {
          from: "me",
          text,
          time: new Date().toISOString(),
        },
      ],
    }));

    setNewMessage("");
  }

    
  const getMatchPercentage = (student) => {
    const myTeachSkills = (teachSkills || []).map((skill) =>
      String(skill).trim().toLowerCase()
    );

    const myLearnSkills = (learnSkills || []).map((skill) =>
      String(skill).trim().toLowerCase()
    );

    const theirTeachSkills = (
      student.teaches || student.teachSkills || []
    ).map((skill) => String(skill).trim().toLowerCase());

    const theirLearnSkills = (
      student.wantsToLearn || student.learnSkills || []
    ).map((skill) => String(skill).trim().toLowerCase());

    const iCanTeach = myTeachSkills.some((skill) =>
      theirLearnSkills.includes(skill)
    );

    const theyCanTeachMe = myLearnSkills.some((skill) =>
      theirTeachSkills.includes(skill)
    );

    if (iCanTeach && theyCanTeachMe) return 100;
    if (iCanTeach || theyCanTeachMe) return 50;

    return 0;
  };


  const allStudents = [
    ...DEMO_STUDENTS,
    ...realStudents,
  ];

  const sortedStudents = [...allStudents].sort((a, b) => {
    return getMatchPercentage(b) - getMatchPercentage(a);
  });

  const filteredStudents = sortedStudents.filter((student) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      student.name,
      student.branch,
      student.college,
      ...(student.teaches || student.teachSkills || []),
      ...(student.wantsToLearn || student.learnSkills || []),
    ].some((value) =>
      String(value).toLowerCase().includes(query)
    );
  });



  if (authLoading) {
    return <div className="auth-page">Loading SkillSwap...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  if (!profileLoaded) {
    return <div className="auth-page">Loading your profile...</div>;
  }

  function HomePage() {
    return (
      <div className="page">
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">WELCOME TO SKILLSWAP</p>
            <h1 className="hero-title">
              Skills Today, Stronger Tomorrow
            </h1>
            <p className="hero-subtitle">
              Teach what you know. Learn what you love. Grow together.
            </p>
            <button
              className="hero-btn"
              onClick={() => setCurrentPage("matches")}
            >
              Explore students →
            </button>
          </div>

          <div className="hero-decoration" aria-hidden="true">
            <span className="hero-circle circle-1" />
            <span className="hero-circle circle-2" />
            <span className="hero-circle circle-3" />
          </div>
        </section>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <strong>{DEMO_STUDENTS.length}</strong>
              <span>Demo profiles</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <div>
              <strong>{teachSkills.length}</strong>
              <span>Skills you teach</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🌱</span>
            <div>
              <strong>{learnSkills.length}</strong>
              <span>Skills to learn</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📨</span>
            <div>
              <strong>{sentRequests.length}</strong>
              <span>Requests sent</span>
            </div>
          </div>
        </div>

        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">My Skill Profile</h2>
            <button
              className="link-btn"
              onClick={() => {
                setEditing(true);
                setCurrentPage("profile");
              }}
            >
              Edit profile →
            </button>
          </div>

          <div className="profile-summary">
            <div className="profile-avatar large">
              {(profile.name || user.email || "S")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div>
              <h3 className="profile-name">
                {profile.name || user.email}
              </h3>
              <p className="profile-info">
                {[profile.year, profile.branch, profile.college]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <p className="bio-text">
            {profile.bio ||
              "Add a short introduction about yourself in your profile."}
          </p>

          <div className="skills-row">
            <div className="skills-group">
              <h4>Skills I Teach</h4>
              <SkillTags skills={teachSkills} type="teach" />
            </div>

            <div className="skills-group">
              <h4>Skills I Want To Learn</h4>
              <SkillTags skills={learnSkills} type="learn" />
            </div>
          </div>

          <p className="cloud-status">
            {profileSaving
              ? "☁️ Saving changes..."
              : "✓ Your profile syncs with Firebase"}
          </p>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Discover students</h2>
            <button
              className="link-btn"
              onClick={() => setCurrentPage("matches")}
            >
              View all →
            </button>
          </div>

          <div className="match-cards-grid home-match-grid">
            {DEMO_STUDENTS.slice(0, 3).map((student) => (
              <article className="match-card" key={student.id}>
                <div className="match-card-top">
                  <div className="match-avatar">
                    {student.name.slice(0, 1)}
                  </div>
                  <span className="demo-label">Demo profile</span>
                </div>

                <h3 className="match-name">{student.name}</h3>
                <p className="match-branch">{student.branch}</p>
                <p className="match-college">
                  {student.college} · {student.year}
                </p>

                <h4>Teaches</h4>
                <SkillTags skills={student.teaches} type="teach" />

                <button
                  className="primary-btn full-width card-action"
                  onClick={() => setCurrentPage("matches")}
                >
                  View profile
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function ProfilePage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Tell other students what you can teach and what you want to learn.
          </p>
        </div>

        <section className="section-card profile-card-large">
          <div className="profile-header">
            <div className="profile-avatar large">
              {(profile.name || user.email || "S")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="profile-header-info">
              <h2>{profile.name || "Your name"}</h2>
              <p className="profile-info">{user.email}</p>
              <span className="profile-status">
                {profileSaving ? "Saving to cloud…" : "Cloud profile"}
              </span>
            </div>

            {!editing && (
              <button
                className="primary-btn"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-form-grid">
            <ProfileField
              label="Full Name"
              value={profile.name}
              disabled={!editing}
              maxLength={60}
              onChange={(value) =>
                setProfile((old) => ({ ...old, name: value }))
              }
            />

            <ProfileField
              label="College"
              value={profile.college}
              disabled={!editing}
              maxLength={100}
              onChange={(value) =>
                setProfile((old) => ({ ...old, college: value }))
              }
            />

            <ProfileField
              label="Branch"
              value={profile.branch}
              disabled={!editing}
              maxLength={100}
              onChange={(value) =>
                setProfile((old) => ({ ...old, branch: value }))
              }
            />

            <label className="profile-field">
              <span>Year</span>
              <select
                className="edit-input"
                value={profile.year}
                disabled={!editing}
                onChange={(event) =>
                  setProfile((old) => ({
                    ...old,
                    year: event.target.value,
                  }))
                }
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Graduate</option>
              </select>
            </label>

            <ProfileField
              label="About Me"
              value={profile.bio}
              disabled={!editing}
              maxLength={400}
              multiline
              onChange={(value) =>
                setProfile((old) => ({ ...old, bio: value }))
              }
            />
          </div>

          {editing && (
            <div className="profile-actions">
              <button className="primary-btn" onClick={saveProfile}>
                Save Changes
              </button>
              <button
                className="secondary-btn"
                onClick={() => {
                  setEditing(false);
                  notify("Editing cancelled.");
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="profile-skills-section">
            <h3>Skills I Teach</h3>
            <SkillTags
              skills={teachSkills}
              type="teach"
              removable
              onRemove={(skill) => removeSkill(skill, "teach")}
            />

            <h3>Skills I Want To Learn</h3>
            <SkillTags
              skills={learnSkills}
              type="learn"
              removable
              onRemove={(skill) => removeSkill(skill, "learn")}
            />

            <div className="add-skill-form">
              <select
                className="edit-input"
                aria-label="Skill category"
                value={skillType}
                onChange={(event) => setSkillType(event.target.value)}
              >
                <option value="teach">Skill I Teach</option>
                <option value="learn">Skill I Want To Learn</option>
              </select>

              <input
                className="edit-input skill-entry"
                placeholder="e.g. Python, UI/UX Design"
                value={newSkill}
                maxLength={50}
                onChange={(event) => setNewSkill(event.target.value)}
                onKeyDown={(event) =>
                  event.key === "Enter" && addSkill()
                }
              />

              <button className="primary-btn" onClick={addSkill}>
                Add Skill
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function MatchesPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Find Matches</h1>
          <p className="page-subtitle">
            Discover students by name, college, branch, or skill.
          </p>
        </div>

        <div className="match-search-wrap">
          <span className="search-symbol">⌕</span>
          <input
            className="match-search"
            placeholder="Search Python, React, UI/UX, or a student..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <p className="results-count">
          {filteredStudents.length} students found · Firebase profiles are real; demo profiles are for preview only
        </p>

        <div className="match-cards-grid">
          {filteredStudents.map((student) => (
            <article className="match-card" key={student.id}>
              <div className="match-card-top">
                <div className="match-avatar">
                  {student.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="demo-label">
                  {realStudents.some((item) => item.id === student.id)
                  ? "Firebase profile"
                  : "Demo profile"}
                </span>
              </div>
              <div className="match-percentage">
                🎯 {getMatchPercentage(student)}% Match
              </div>
              <h3 className="match-name">{student.name}</h3>
              <p className="match-branch">{student.branch}</p>
              <p className="match-college">
                {student.college} · {student.year}
              </p>

              <div className="match-skills-section">
                <p className="match-skill-label">Can teach</p>
                <SkillTags skills={student.teaches} type="teach" />
              </div>

              <div className="match-skills-section">
                <p className="match-skill-label">Wants to learn</p>
                <SkillTags
                  skills={student.wantsToLearn}
                  type="learn"
                />
              </div>

              <button
                className="primary-btn full-width card-action"
                disabled={sentRequests.includes(student.id)}
                onClick={() => sendRequest(student)}
              >
                {sentRequests.includes(student.id)
                  ? "Request Sent"
                  : "Send Swap Request"}
              </button>
            </article>
          ))}

          {filteredStudents.length === 0 && (
            <div className="empty-state">
              No students match that search. Try another skill or name.
            </div>
          )}
        </div>
      </div>
    );
  }

  function RequestsPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Swap Requests</h1>
          <p className="page-subtitle">Track your saved requests.</p>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            No received requests yet. When another student sends you a swap request, it will appear here.
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <article className="request-card" key={request.id}>
                <div>
                  <h3>{request.name}</h3>
                  <p className="request-branch">{request.branch}</p>
                  <p>
                    Wants to learn: <strong>{request.wantsToLearn}</strong>
                  </p>
                  <p>
                    Offers in return:{" "}
                    <strong>{request.teachesInReturn}</strong>
                  </p>
                </div>

                <div className="request-actions">
                  <span
                    className={`status-badge ${
                      request.status.toLowerCase() === "pending"
                        ? "status-pending"
                        : `status-${request.status.toLowerCase()}`
                    }`}
                  >
                    {request.status.toLowerCase()}
                  </span>

                  {request.status.toLowerCase() === "pending" && (
                    <>
                      <button
                        className="accept-btn"
                        onClick={() =>
                          updateRequest(request.id, "Accepted")
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="decline-btn"
                        onClick={() =>
                          updateRequest(request.id, "Declined")
                        }
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  function MessagesPage() {
  const currentMessages = messages[activeContact.trim()] || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">
          Keep your skill-exchange conversations organized.
        </p>
      </div>

      <section className="section-card messages-card">
        <div className="messages-intro">
          <span className="messages-intro-icon">💬</span>
          <div>
            <h3>Your Conversations</h3>
            <p>
              Choose a contact and write a message about the skill
              you want to learn or teach.
            </p>
          </div>
        </div>

        <label className="profile-field">
          <span>Contact name or ID</span>
          <input
            className="edit-input"
            placeholder="Example: Moukthika"
            value={activeContact}
            onChange={(event) =>
              setActiveContact(event.target.value)
            }
          />
        </label>

        <div className="chat-window">
          {currentMessages.length === 0 ? (
            <div className="chat-empty">
              <span>✉️</span>
              <h3>No messages yet</h3>
              <p>
                Type a message below to start your conversation.
              </p>
            </div>
          ) : (
            currentMessages.map((message, index) => (
              <div
                className={`message ${
                  message.from === "me"
                    ? "message-me"
                    : "message-them"
                }`}
                key={`${message.time || "message"}_${index}`}
              >
                <p>{message.text}</p>
                <small>
                  {message.time
                    ? new Date(message.time).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : ""}
                </small>
              </div>
            ))
          )}
        </div>

        <div className="chat-input-area">
          <input
            className="chat-input"
            placeholder="Write a message..."
            value={newMessage}
            onChange={(event) =>
              setNewMessage(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            type="button"
            className="primary-btn"
            disabled={!activeContact.trim() || !newMessage.trim()}
            onClick={sendMessage}
          >
            Send
          </button>
        </div>

        <p className="messages-note">
          Demo mode: messages are saved to your own SkillSwap
          profile. They are not delivered to another user's account yet.
        </p>
      </section>
    </div>
  );
}

  function RatingsPage() {
    const key = activeContact.trim();

    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Ratings & Reviews</h1>
          <p className="page-subtitle">
            Keep track of your personal feedback.
          </p>
        </div>

        <section className="section-card">
          <label className="profile-field">
            <span>Student or exchange name</span>
            <input
              className="edit-input"
              value={activeContact}
              onChange={(event) => setActiveContact(event.target.value)}
              placeholder="Enter student name"
            />
          </label>

          <h3 className="review-heading">Your rating</h3>

          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={`star ${
                  star <= (ratings[key] || 0) ? "star-active" : ""
                }`}
                onClick={() =>
                  setRatings((old) => ({ ...old, [key]: star }))
                }
                aria-label={`${star} stars`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            className="review-textarea"
            placeholder="Write your review..."
            maxLength={1000}
            value={reviews[key] || ""}
            onChange={(event) =>
              setReviews((old) => ({ ...old, [key]: event.target.value }))
            }
          />

          <button
            className="primary-btn"
            onClick={() => {
              if (!key) {
                notify("Enter a student or exchange name first.");
                return;
              }
              notify("Review saved to your account!");
            }}
          >
            Save Review
          </button>
        </section>
      </div>
    );
  }

  function SettingsPage() {
    const labels = {
      emailNotif: "Email notifications",
      pushNotif: "Push notifications",
      profileVisible: "Profile visible to students",
      showOnline: "Show online status",
    };

    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Manage your account preferences.
          </p>
        </div>

        <section className="section-card">
          <div className="settings-account">
            <div className="profile-avatar">
              {(profile.name || user.email || "S")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div>
              <strong>{profile.name || "SkillSwap user"}</strong>
              <p>{user.email}</p>
            </div>
          </div>

          <h3 className="settings-section-title">Preferences</h3>

          {Object.entries(settings).map(([key, value]) => (
            <label className="settings-toggle-row" key={key}>
              <span>{labels[key] || key}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={() =>
                  setSettings((old) => ({
                    ...old,
                    [key]: !old[key],
                  }))
                }
              />
            </label>
          ))}

          <div className="settings-actions">
            <button
              className="primary-btn"
              onClick={() => notify("Settings saved!")}
            >
              Save Settings
            </button>
            <button className="secondary-btn" onClick={logout}>
              Log Out
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Render page content without recreating input components on every keystroke.
  const pageContent = {
    home: HomePage(),
    profile: ProfilePage(),
    matches: MatchesPage(),
    messages: MessagesPage(),
    requests: RequestsPage(),
    ratings: RatingsPage(),
    settings: SettingsPage(),
  };

  return (
    <>
      {notice && (
        <div className="success-popup" role="status">
          {notice}
        </div>
      )}

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🔄</div>
            <span className="logo-text">SkillSwap</span>
          </div>

          <nav className="sidebar-nav" aria-label="Main navigation">
            {PAGES.map(([key, icon, label]) => (
              <button
                type="button"
                key={key}
                className={`nav-item ${
                  currentPage === key ? "nav-active" : ""
                }`}
                onClick={() => setCurrentPage(key)}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {(profile.name || user.email || "S")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <p className="sidebar-user-name">
                  {profile.name || user.email}
                </p>
                <p className="sidebar-user-info">
                  {profile.branch || "Complete your profile"}
                </p>
              </div>
            </div>

            <button
              className="secondary-btn sidebar-logout"
              onClick={logout}
            >
              Log Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          

          {pageContent[currentPage] || pageContent.home}
        </main>
      </div>
    </>
  );
}

export default App;
