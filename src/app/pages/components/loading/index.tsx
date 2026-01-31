"use client";
import "./style.css";

const Loader = () => {
  let span: Element;
  const show = () => {
    const container = document.createElement("div");
    container.classList.add("loadingContainer");
    container.id = "loader";
    span = document.createElement("span");
    span.classList.add("loader");

    container.appendChild(span);
    document.getElementsByTagName("body")[0].appendChild(container);
  };

  const hidde = () => {
    document.getElementById("loader")?.remove();
  };

  return {
    show,
    hidde,
  };
};

export default Loader;
