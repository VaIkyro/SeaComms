import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { adminEmails } from "../App";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("commendations");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [commendations, setCommendations] = useState([]);
  const [userCommendations, setUserCommendations] = useState([]);
  const [progressInputs, setProgressInputs] = useState({});
  const [profileUser, setProfileUser] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const navigate = useNavigate();

  const isAdmin =
    profileUser &&
    Array.isArray(adminEmails) &&
    adminEmails.includes(profileUser.email);

  // Load logged-in user once
  useEffect(() => {
    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) console.error("Error loading user:", error.message);
        setProfileUser(data?.user ?? null);
      } catch (err) {
        console.error("Unexpected error loading user:", err);
        setProfileUser(null);
      }
    }
    loadUser();
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("id");
        if (error) console.error("Error fetching categories:", error.message);
        else setCategories(data ?? []);
      } catch (err) {
        console.error("Unexpected error fetching categories:", err);
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  // Fetch commendations when category changes
  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchCommendations() {
      try {
        const { data, error } = await supabase
          .from("commendations")
          .select("*")
          .eq("category_id", selectedCategory.id)
          .order("id");
        if (error) console.error("Error fetching commendations:", error.message);
        else setCommendations(data ?? []);
      } catch (err) {
        console.error("Unexpected error fetching commendations:", err);
        setCommendations([]);
      }
    }
    fetchCommendations();
  }, [selectedCategory]);

  // Fetch user progress
  useEffect(() => {
    async function fetchUserProgress() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from("user_commendations")
          .select("*")
          .eq("user_id", user.id);

        if (error) console.error("Error fetching user progress:", error.message);
        else setUserCommendations(data ?? []);
      } catch (err) {
        console.error("Unexpected error fetching user progress:", err);
        setUserCommendations([]);
      }
    }
    fetchUserProgress();
  }, [selectedCategory]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleInputChange = (commendationId, value) => {
    setProgressInputs((prev) => ({ ...prev, [commendationId]: value }));
  };

  const handleUpdateProgress = async (commendation) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return console.error("No user logged in");

      const newAmount = parseInt(progressInputs[commendation.id]);
      if (
        isNaN(newAmount) ||
        newAmount < 0 ||
        newAmount > commendation.total_amount
      ) {
        return console.error("Invalid progress input");
      }

      const { data, error } = await supabase
        .from("user_commendations")
        .upsert([
          {
            user_id: user.id,
            commendation_id: commendation.id,
            current_amount: newAmount,
          },
        ])
        .select();

      if (error) console.error("Error updating progress:", error.message);
      else {
        setSaveMessage("Progress Saved ✅");
        setTimeout(() => setSaveMessage(""), 1500);

        setUserCommendations((prev) => {
          const filtered = prev.filter(
            (uc) => uc.commendation_id !== commendation.id
          );
          return [...filtered, data[0]];
        });
      }
    } catch (err) {
      console.error("Unexpected error updating progress:", err);
    }
  };

  const getUserProgress = (commendationId) => {
    const entry = userCommendations.find(
      (uc) => uc.commendation_id === commendationId
    );
    return entry ? entry.current_amount : 0;
  };

  const getCategorySummary = () => {
    if (!commendations.length) return null;

    let totalRequired = 0;
    let totalProgress = 0;
    let completed = 0;

    commendations.forEach((comm) => {
      const userAmount = getUserProgress(comm.id);
      const clamped = Math.min(userAmount, comm.total_amount);

      totalRequired += comm.total_amount;
      totalProgress += clamped;

      if (clamped >= comm.total_amount) {
        completed++;
      }
    });

    if (totalRequired === 0) return null;

    const percent = Math.floor((totalProgress / totalRequired) * 100).toFixed(1);

    return {
      totalRequired,
      totalProgress,
      percent,
      completed,
      totalComms: commendations.length,
    };
  };

  return (
    <div>
      {saveMessage && <div style={styles.toast}>{saveMessage}</div>}

      <div style={styles.header}>
        <h1 style={styles.logo}>Sea Commendations</h1>
        <div style={styles.tabs}>
          <button
            style={activeTab === "commendations" ? styles.activeTab : styles.tab}
            onClick={() => {
              setActiveTab("commendations");
              setSelectedCategory(null);
            }}
          >
            Commendations
          </button>
          <button
            style={activeTab === "profile" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </div>
      </div>

      {activeTab === "commendations" && selectedCategory && (
        <div style={styles.subHeaderBar}>
          <button
            style={styles.returnButton}
            onClick={() => setSelectedCategory(null)}
          >
            ← Return
          </button>
          <h2 style={styles.subHeaderTitle}>
            {selectedCategory.name} Commendations
          </h2>
        </div>
      )}

      <div style={styles.content}>
        {activeTab === "commendations" && (
          <>
            {!selectedCategory && (
              <div style={styles.cardsContainer}>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={styles.card}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            )}

            {selectedCategory && (
              <div style={styles.categoryDetails}>
                {(() => {
                  const s = getCategorySummary();
                  if (!s) return null;

                  return (
                    <div style={styles.summaryBox}>
                      <h3 style={{ margin: 0 }}>Category Progress</h3>
                      <p style={{ margin: "5px 0" }}>
                        Completed: {s.completed} / {s.totalComms}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        Total Progress: {s.totalProgress} / {s.totalRequired}
                      </p>
                      <div style={styles.summaryBarBackground}>
                        <div
                          style={{
                            ...styles.summaryBarFill,
                            width: `${s.percent}%`,
                          }}
                        />
                      </div>
                      <p style={{ margin: "5px 0" }}>
                        Overall Progress: <strong>{s.percent}%</strong>
                      </p>
                    </div>
                  );
                })()}

                {commendations.map((comm) => {
                  const progress = getUserProgress(comm.id);

                  return (
                    <div
                      key={comm.id}
                      style={{
                        ...styles.commCard,
                        ...(progress >= comm.total_amount
                          ? styles.commCardComplete
                          : {}),
                      }}
                    >
                      <h3>{comm.title}</h3>
                      {comm.subcategory && <p>{comm.subcategory}</p>}
                      <p>
                        Progress: {progress} / {comm.total_amount}
                      </p>
                      <div style={styles.progressBarBackground}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${Math.min(
                              (progress / comm.total_amount) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div style={styles.progressRow}>
                        <button
                          style={styles.adjustButton}
                          onClick={() =>
                            handleInputChange(
                              comm.id,
                              Math.max(
                                (progressInputs[comm.id] ?? progress) - 1,
                                0
                              )
                            )
                          }
                        >
                          –
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={comm.total_amount}
                          value={progressInputs[comm.id] ?? progress}
                          onChange={(e) =>
                            handleInputChange(
                              comm.id,
                              Math.min(Number(e.target.value), comm.total_amount)
                            )
                          }
                          style={styles.progressInput}
                        />
                        <button
                          style={styles.adjustButton}
                          onClick={() =>
                            handleInputChange(
                              comm.id,
                              Math.min(
                                (progressInputs[comm.id] ?? progress) + 1,
                                comm.total_amount
                              )
                            )
                          }
                        >
                          +
                        </button>
                        <button
                          style={styles.maxButton}
                          onClick={() => handleInputChange(comm.id, comm.total_amount)}
                        >
                          Max
                        </button>
                        <button
                          onClick={() => handleUpdateProgress(comm)}
                          style={styles.progressButton}
                        >
                          Update
                        </button>
                      </div>
                      {comm.description && <p>{comm.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "profile" && (
          <div style={styles.profile}>
            <h2>Profile</h2>
            <p>Email: {profileUser?.email ?? "Unknown"}</p>
            <button style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>

            {isAdmin && (
              <button
                style={{ ...styles.logoutButton, backgroundColor: "#3a8bff", marginTop: "10px" }}
                onClick={() => navigate("/admin")}
              >
                Admin Panel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ✅ FULL STYLES WITH NEW ADDITIONS */
const styles = {
  toast: {
    position: "fixed",
    top: "70px",
    right: "20px",
    backgroundColor: "#28a745",   // ✅ GREEN
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    zIndex: 2000,
    fontWeight: "bold",
  },

  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    backgroundColor: "#2c2c2c",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    color: "#ffd700",
    zIndex: 1000,
    boxShadow: "0 4px 6px rgba(0,0,0,0.4)",
  },

  logo: { margin: 0, fontSize: "20px" },

  tabs: { display: "flex", gap: "10px" },

  tab: {
    background: "none",
    border: "none",
    color: "#ffd700",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "background 0.2s",
  },

  activeTab: {
    backgroundColor: "#ffd700",
    color: "#1a1a1a",
    fontWeight: "bold",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  subHeaderBar: {
    position: "relative",
    backgroundColor: "#3a3a3a",
    padding: "10px 20px",
    marginTop: "60px",
    height: "50px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },

  returnButton: {
    position: "absolute",
    top: "50%",
    left: "20px",
    transform: "translateY(-50%)",
    padding: "6px 12px",
    width: "auto",
    backgroundColor: "#ffd700",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  subHeaderTitle: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    margin: 0,
    color: "#ffd700",
    fontSize: "20px",
    fontWeight: "bold",
  },

  content: {
    paddingTop: "110px",
    maxWidth: "1700px",
    margin: "0 auto",
  },

  cardsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: "20px",
  },

  card: {
    backgroundColor: "#2c2c2c",
    borderRadius: "12px",
    padding: "20px",
    margin: "15px",
    cursor: "pointer",
    minWidth: "150px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  categoryDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
    gap: "50px",
    marginTop: "20px",
  },

  commCard: {
    width: "100%",    // ✅ ensures it fills its grid cell
    backgroundColor: "#2c2c2c",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  /* ✅ Completed Commendation Glow */
  commCardComplete: {
    border: "2px solid #ffd700",
    boxShadow: "0 0 15px rgba(255,215,0,0.7)",
  },

  /* ✅ Progress Bar Styles */
  progressBarBackground: {
    width: "100%",
    height: "10px",
    backgroundColor: "#444",
    borderRadius: "5px",
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#ffd700",
  },

  progressRow: {
    display: "flex",
    gap: "10px",
    alignItems: "stretch",
  },

  progressInput: {
    flex: 1,
    height: "36px",
    padding: "0 10px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },

  progressButton: {
    width: "100px",
    height: "36px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#ffd700",
    fontWeight: "bold",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  profile: {
    marginTop: "20px",
    backgroundColor: "#2c2c2c",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },

  logoutButton: {
    marginTop: "20px",
    padding: "8px 16px",
    backgroundColor: "#ffd700",
    color: "#1a1a1a",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  adjustButton: {
    width: "40px",
    height: "36px",
    backgroundColor: "#444",
    color: "#ffd700",
    border: "1px solid #666",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  maxButton: {
    width: "55px",
    height: "36px",
    padding: "0 10px",
    backgroundColor: "#555",
    color: "#ffd700",
    border: "1px solid #666",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  summaryBox: {
    backgroundColor: "#2c2c2c",
    padding: "15px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    marginBottom: "20px",
    textAlign: "center",
    color: "#ffd700",
  },

  summaryBarBackground: {
    width: "100%",
    height: "12px",
    backgroundColor: "#555",
    borderRadius: "8px",
    overflow: "hidden",
    margin: "10px 0",
  },

  summaryBarFill: {
    height: "100%",
    backgroundColor: "#ffd700",
    borderRadius: "8px 0 0 8px",
  },
};
