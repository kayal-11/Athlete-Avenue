// =======================
//  Firebase Imports
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// =======================
// Firebase Config
// =======================
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase initialized");

// =======================
// LOGIN
// =======================
const loginBtn = document.getElementById("login-btn");

if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const errorDiv = document.getElementById("login-error");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCred.user.uid;

      // Get user Firestore info
      const snap = await getDoc(doc(db, "users", userId));
      const userData = snap.data();

      // Save name & sport for dashboard
      if (userData) {
        localStorage.setItem("athlete_name", userData.name || "");
        localStorage.setItem("athlete_sport", userData.sport || "");
      }

      errorDiv.style.color = "green";
      errorDiv.textContent = "Login successful!";

      setTimeout(() => {
        // If profile completed → dashboard
        if (userData && userData.profileComplete) {
          window.location = "dashboard.html";
        } else {
          window.location = "profile.html";
        }
      }, 800);

    } catch (error) {
      errorDiv.style.color = "red";
      errorDiv.textContent = "Login failed: " + error.message;
    }
  });
}

// =======================
// SIGNUP
// =======================
const signupBtn = document.getElementById("signup-btn");

if (signupBtn) {
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirm = document.getElementById("signup-confirm").value.trim();
    const role = document.getElementById("signup-role").value;
    const errorDiv = document.getElementById("signup-error");

    if (password !== confirm) {
      errorDiv.style.color = "red";
      errorDiv.textContent = "Passwords do not match!";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role,
        profileComplete: false,
        createdAt: serverTimestamp()
      });

      errorDiv.style.color = "green";
      errorDiv.textContent = "Signup successful!";
      setTimeout(() => (window.location = "profile.html"), 900);

    } catch (error) {
      errorDiv.style.color = "red";
      errorDiv.textContent = error.message;
    }
  });
}

// =======================
// PROFILE SETUP
// =======================
const profileSave = document.getElementById("profile-save");

if (profileSave) {
  profileSave.addEventListener("click", async () => {
    const name = document.getElementById("profile-name").value.trim();
    const role = document.getElementById("profile-role").value;
    const sport = document.getElementById("profile-sport").value.trim();
    const bio = document.getElementById("profile-bio").value.trim();
    const achievements = document.getElementById("profile-achievements").value.trim();
    const proofFile = document.getElementById("profile-proof").files[0];

    if (!auth.currentUser) {
      alert("Please log in again.");
      window.location = "index.html";
      return;
    }

    let proofURL = "";
    if (proofFile) {
      const fileRef = ref(storage, `proofs/${auth.currentUser.uid}`);
      await uploadBytes(fileRef, proofFile);
      proofURL = await getDownloadURL(fileRef);
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      name,
      role,
      sport,
      bio,
      achievements,
      proofURL,
      profileComplete: true,
      updatedAt: serverTimestamp()
    });

    // Save for dashboard
    localStorage.setItem("athlete_name", name);
    localStorage.setItem("athlete_sport", sport);

    window.location = "dashboard.html";
  });
}

// =======================
// DASHBOARD POSTS
// =======================
const postsDiv = document.getElementById("posts");

if (postsDiv) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    postsDiv.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      postsDiv.innerHTML += `
        <div class="post">
          <div class="author">${post.author || "Anonymous"}</div>
          <div class="meta">
            ${
              post.createdAt
                ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                : ""
            }
          </div>
          <div>${post.content || ""}</div>
          <div class="icons"><span>♥ ${post.likes?.length || 0}</span></div>
        </div>
      `;
    });
  });
}

// =======================
// LOGOUT
// =======================
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.clear();
    window.location = "index.html";
  });
}

// =======================
// AUTH WATCHER
// =======================
onAuthStateChanged(auth, (user) => {
  console.log(user ? "Logged in: " + user.email : "Logged out");
});
