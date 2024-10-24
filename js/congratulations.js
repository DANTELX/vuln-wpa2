"use strict";

const finished = localStorage.getItem("finished");

if (!finished) {
  location = `${location.protocol}//${location.host}/index.html`;
} else {
  localStorage.clear();
  const redirect = () => {
    setTimeout(function () {
      location = `${location.protocol}//${location.host}/index.html`;
    }, 0);
    removeEventListener("beforeunload", redirect);
  };
  addEventListener("beforeunload", redirect);
}
