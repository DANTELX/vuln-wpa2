"use strict";

const redirect = () => {
  setTimeout(function () {
    location = `${location.protocol}//${location.host}/index.html`;
  }, 0);
  removeEventListener("beforeunload", redirect);
};
addEventListener("beforeunload", redirect);
