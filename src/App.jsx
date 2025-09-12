// src/App.jsx
import React from "react";
import CatalogoWeb from "./CatalogoWeb";

export default function App() {
  return (
    <div className="min-h-screen">
      {/* Si quieres la barra roja, colócala DENTRO del componente */}
      {/* <div className="h-2 bg-red-500"></div> */}
      <CatalogoWeb />
    </div>
  );
}
