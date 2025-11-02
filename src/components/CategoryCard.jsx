import React from "react";
import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  return (
    <Link to={`/category/${category.id}`} className="card">
      <h3>{category.name}</h3>
      <p>{category.description}</p>
    </Link>
  );
}
