import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [commendationTitle, setCommendationTitle] = useState("");
  const [commendationSubcategory, setCommendationSubcategory] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id");

      if (error) {
        console.error("Error fetching categories:", error.message);
      } else {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  // Success/Error popup
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return showMessage("error", "Category name cannot be empty");

    if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
      return showMessage("error", "Category already exists");
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select();

    if (error) {
      console.error("Error adding category:", error.message);
      showMessage("error", "Failed to add category");
    } else if (data) {
      setCategories([...categories, ...data]);
      setNewCategoryName("");
      showMessage("success", "Category added successfully!");
    }
  };

  // Add new commendation
  const handleAddCommendation = async (e) => {
    e.preventDefault();

    const title = commendationTitle.trim();
    const subcategory = commendationSubcategory.trim();
    const total = parseInt(totalAmount);

    if (!selectedCategoryId) return showMessage("error", "Please select a category");
    if (!title) return showMessage("error", "Title cannot be empty");
    if (!total || total <= 0) return showMessage("error", "Total amount must be greater than 0");

    // Prevent duplicates in same category
    const { data: existing, error: fetchError } = await supabase
      .from("commendations")
      .select("*")
      .eq("category_id", selectedCategoryId)
      .eq("title", title);

    if (fetchError) return showMessage("error", "Failed to check duplicates");
    if (existing.length > 0) return showMessage("error", "Commendation already exists in this category");

    const { data, error } = await supabase
      .from("commendations")
      .insert([
        {
          category_id: selectedCategoryId,
          title,
          subcategory: subcategory || null,
          total_amount: total,
          description: description || "",
        },
      ])
      .select();

    if (error) {
      console.error("Error adding commendation:", error.message);
      showMessage("error", "Failed to add commendation");
    } else {
      setSelectedCategoryId("");
      setCommendationTitle("");
      setCommendationSubcategory("");
      setTotalAmount("");
      setDescription("");
      showMessage("success", "Commendation added successfully!");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      {/* ✅ Return Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "8px 16px",
          backgroundColor: "#ffd700",
          color: "#1a1a1a",
          border: "none",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Return
      </button>

      <h1>Admin Panel</h1>

      {/* Success/Error Popup */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "10px 20px",
            borderRadius: "6px",
            backgroundColor: message.type === "success" ? "#4caf50" : "#f44336",
            color: "white",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Add Category Section */}
      <section style={{ marginTop: "30px" }}>
        <h2>Add Category</h2>
        <form
          onSubmit={handleAddCategory}
          style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "flex-start" }}
        >
          <input
            type="text"
            placeholder="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{
              flex: 4,
              height: "44px",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            style={{
              flex: 1,
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#ffd700",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>
      </section>

      {/* Add Commendation Section */}
      <section style={{ marginTop: "40px" }}>
        <h2>Add Commendation</h2>
        <form
          onSubmit={handleAddCommendation}
          style={{ display: "grid", gap: "10px", marginTop: "10px" }}
        >
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Commendation Title"
            value={commendationTitle}
            onChange={(e) => setCommendationTitle(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
          />

          <input
            type="text"
            placeholder="Subcategory (optional)"
            value={commendationSubcategory}
            onChange={(e) => setCommendationSubcategory(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
          />

          <input
            type="number"
            placeholder="Total Amount Required"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px", minHeight: "60px" }}
          />

          <button
            type="submit"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#ffd700",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add Commendation
          </button>
        </form>
      </section>
    </div>
  );
}
