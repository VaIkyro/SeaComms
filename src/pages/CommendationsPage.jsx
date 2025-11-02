import React from "react";
import { useParams, Link } from "react-router-dom";
import { categories } from "../data/categories";

export default function CommendationsPage() {
  const { id } = useParams();
  const category = categories.find(c => c.id === Number(id));

  if (!category) {
    return (
      <div className="container">
        <p>Category not found.</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/">← Back</Link>
      <h2>{category.name}</h2>
      <p>{category.description}</p>

      <div style={{ marginTop: "20px" }}>
        <p>(Coming soon) Commendations for {category.name}</p>
      </div>
    </div>
  );
}
