function toggleDarkMode() {
  var navBar = document.nav;
  if (navBar.classList.contains === "bg-light") {
    navBar.classList.replace("bg-light", "bg-dark");
    navBar.classList.remove("bg-light");
    navBar.classList.add("bg-dark");
  } else {
    navBar.classList.add("bg-light");
    navBar.classList.remove("bg-dark");
  }
}